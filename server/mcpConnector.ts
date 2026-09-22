import { isIP, type LookupFunction } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";

const MAX_METADATA_BYTES = 256 * 1024;
const MCP_PROTOCOL_VERSION = "2026-07-28";

type DiscoveryDependencies = {
  transport?: (url: URL, init: RequestInit, validated: ValidatedAddress) => Promise<Response>;
  resolveIpv4?: typeof resolve4;
  resolveIpv6?: typeof resolve6;
};

type ProtectedResourceMetadata = {
  resource?: unknown;
  authorization_servers?: unknown;
  scopes_supported?: unknown;
};

type AuthorizationServerMetadata = {
  issuer?: unknown;
  authorization_endpoint?: unknown;
  token_endpoint?: unknown;
  registration_endpoint?: unknown;
  scopes_supported?: unknown;
  grant_types_supported?: unknown;
  code_challenge_methods_supported?: unknown;
  client_id_metadata_document_supported?: unknown;
};

export type McpAuthorizationServer = {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string | null;
  registrationEndpoint: string | null;
  scopes: string[];
  grantTypes: string[];
  supportsPkce: boolean;
  supportsClientMetadataDocument: boolean;
};

export type McpDiscoveryResult = {
  endpoint: string;
  resource: string;
  metadataUrl: string;
  scopes: string[];
  authorizationServers: McpAuthorizationServer[];
};

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  const [a, b] = octets;
  const c = octets[2];
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 0) ||
    (a === 192 && b === 168) || (a === 192 && b === 88 && c === 99) || (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113);
}

function parseIpv6(address: string) {
  const value = address.toLowerCase().split("%")[0];
  if ((value.match(/::/g) ?? []).length > 1) return null;
  const convertPart = (part: string) => {
    if (!part) return [];
    const fields = part.split(":");
    const last = fields.at(-1);
    if (last?.includes(".")) {
      if (isIP(last) !== 4) return null;
      const octets = last.split(".").map(Number);
      fields.splice(-1, 1, ((octets[0] << 8) | octets[1]).toString(16), ((octets[2] << 8) | octets[3]).toString(16));
    }
    if (fields.some(field => !/^[0-9a-f]{1,4}$/.test(field))) return null;
    return fields.map(field => Number.parseInt(field, 16));
  };
  const [leftRaw, rightRaw = ""] = value.split("::");
  const left = convertPart(leftRaw);
  const right = convertPart(rightRaw);
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if ((value.includes("::") && missing < 1) || (!value.includes("::") && missing !== 0)) return null;
  return [...left, ...Array(Math.max(0, missing)).fill(0), ...right] as number[];
}

function isPrivateIpv6(address: string) {
  const words = parseIpv6(address);
  if (!words) return true;
  const [first, second, third, fourth] = words;
  const isMapped = words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff;
  if (isMapped) return isPrivateIpv4(`${words[6] >> 8}.${words[6] & 255}.${words[7] >> 8}.${words[7] & 255}`);
  if (first < 0x2000 || first > 0x3fff) return true;
  if (first === 0x2001 && second === 0x0db8) return true;
  if (first === 0x2001 && (second & 0xfff0) === 0x0010) return true;
  if (first === 0x2001 && second === 0x0002) return true;
  if (first === 0x0064 && second === 0xff9b) return true;
  if (first === 0x2002) {
    const embedded = `${second >> 8}.${second & 255}.${third >> 8}.${third & 255}`;
    if (isPrivateIpv4(embedded)) return true;
  }
  return first === 0x2001 && second === 0x0000 && third === 0 && fourth === 0;
}

export function isPublicIpAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return !isPrivateIpv4(address);
  if (version === 6) return !isPrivateIpv6(address);
  return false;
}

export function normalizePublicHttpsUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("أدخل رابط MCP صالحًا وكاملًا");
  }
  if (url.protocol !== "https:") throw new Error("يجب أن يستخدم رابط MCP اتصال HTTPS");
  if (url.username || url.password) throw new Error("لا تضع بيانات دخول داخل رابط MCP");
  if (url.hash) throw new Error("لا يمكن أن يحتوي رابط MCP على جزء #fragment");
  if (url.port && url.port !== "443") throw new Error("يسمح موصل MCP بمنفذ HTTPS القياسي 443 فقط");
  url.hostname = url.hostname.toLowerCase();
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("لا يمكن للموصل الوصول إلى عناوين محلية أو داخلية");
  }
  if (isIP(host) && !isPublicIpAddress(host)) throw new Error("لا يمكن للموصل الوصول إلى عنوان IP خاص أو محلي");
  return url;
}

export function deriveProtectedResourceMetadataUrl(endpoint: URL) {
  const suffix = endpoint.pathname === "/" ? "" : endpoint.pathname.replace(/\/$/, "");
  return new URL(`/.well-known/oauth-protected-resource${suffix}${endpoint.search}`, endpoint.origin);
}

function stringList(value: unknown, max = 100) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0 && entry.length <= 500).slice(0, max);
}

function metadataUrlFromChallenge(header: string | null) {
  if (!header) return null;
  const quoted = header.match(/(?:^|[,\s])resource_metadata\s*=\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i)?.[1];
  if (quoted) return quoted.replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
  return header.match(/(?:^|[,\s])resource_metadata\s*=\s*([^,\s]+)/i)?.[1] ?? null;
}

type ValidatedAddress = { address: string; family: 4 | 6 };

async function resolvePublicAddress(url: URL, dependencies: DiscoveryDependencies): Promise<ValidatedAddress> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(host);
  if (literalFamily) return { address: host, family: literalFamily } as ValidatedAddress;
  const lookup4 = dependencies.resolveIpv4 ?? resolve4;
  const lookup6 = dependencies.resolveIpv6 ?? resolve6;
  const settled = await Promise.allSettled([lookup4(host), lookup6(host)]);
  const addresses = settled.flatMap((result, index) => result.status === "fulfilled" ? result.value.map(address => ({ address, family: (index === 0 ? 4 : 6) as 4 | 6 })) : []);
  if (addresses.length === 0) throw new Error(`تعذر التحقق من عنوان الخادم ${host}`);
  if (addresses.some(candidate => !isPublicIpAddress(candidate.address))) throw new Error("رفض الاتصال لأن اسم الخادم يشير إلى شبكة خاصة أو محلية");
  return addresses[0];
}

function pinnedHttpsFetch(url: URL, init: RequestInit, validated: ValidatedAddress) {
  return new Promise<Response>((resolve, reject) => {
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((value, key) => { headers[key] = value; });
    const lookup: LookupFunction = (_hostname, options, callback) => {
      if (options.all) callback(null, [{ address: validated.address, family: validated.family }]);
      else callback(null, validated.address, validated.family);
    };
    const request = httpsRequest(url, { method: init.method ?? "GET", headers, lookup, signal: init.signal ?? undefined }, response => {
      const responseHeaders = new Headers();
      for (let index = 0; index < response.rawHeaders.length; index += 2) responseHeaders.append(response.rawHeaders[index], response.rawHeaders[index + 1]);
      const status = response.statusCode ?? 500;
      const hasBody = ![204, 205, 304].includes(status) && (init.method ?? "GET") !== "HEAD";
      const body = hasBody ? Readable.toWeb(response) as ReadableStream<Uint8Array> : null;
      resolve(new Response(body, { status, statusText: response.statusMessage, headers: responseHeaders }));
    });
    request.once("error", reject);
    request.end();
  });
}

function defaultTransport(url: URL, init: RequestInit, validated: ValidatedAddress) {
  // Cloudflare's node:https implementation does not support custom DNS lookup.
  // Workers use public-only global fetch (enforced by wrangler.jsonc); Node keeps
  // the validated address pinned to prevent a DNS rebinding between checks.
  if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
    return fetch(url, init);
  }
  return pinnedHttpsFetch(url, init, validated);
}

async function cancelResponseBody(response: Response) {
  if (!response.body) return;
  await response.body.cancel().catch(() => undefined);
}

async function safeFetch(urlInput: string | URL, init: RequestInit, dependencies: DiscoveryDependencies) {
  let url = normalizePublicHttpsUrl(String(urlInput));
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const validated = await resolvePublicAddress(url, dependencies);
    const requestInit = { ...init, redirect: "manual" as const, signal: AbortSignal.timeout(8_000) };
    const response = await (dependencies.transport ?? defaultTransport)(url, requestInit, validated);
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url };
    await cancelResponseBody(response);
    const location = response.headers.get("location");
    if (!location) throw new Error("أعاد الخادم تحويلاً من دون عنوان وجهة");
    url = normalizePublicHttpsUrl(new URL(location, url).toString());
  }
  throw new Error("تجاوز الخادم الحد المسموح لتحويلات HTTP");
}

async function readJsonMetadata(response: Response) {
  const announcedLength = Number(response.headers.get("content-length") ?? 0);
  if (announcedLength > MAX_METADATA_BYTES) throw new Error("ملف اكتشاف OAuth أكبر من الحد المسموح");
  if (!response.body) throw new Error("أعاد الخادم ملف اكتشاف OAuth فارغًا");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_METADATA_BYTES) {
      await reader.cancel();
      throw new Error("ملف اكتشاف OAuth أكبر من الحد المسموح");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("أعاد الخادم ملف اكتشاف OAuth غير صالح");
  }
}

function authorizationMetadataCandidates(issuer: URL) {
  const issuerPath = issuer.pathname === "/" ? "" : issuer.pathname.replace(/\/$/, "");
  return Array.from(new Set([
    new URL(`/.well-known/oauth-authorization-server${issuerPath}`, issuer.origin).toString(),
    new URL(`${issuerPath}/.well-known/openid-configuration`, issuer.origin).toString(),
    new URL(`/.well-known/openid-configuration${issuerPath}`, issuer.origin).toString(),
  ]));
}

async function discoverAuthorizationServer(issuerValue: string, dependencies: DiscoveryDependencies): Promise<McpAuthorizationServer> {
  const issuer = normalizePublicHttpsUrl(issuerValue);
  let lastStatus = 0;
  for (const candidate of authorizationMetadataCandidates(issuer)) {
    const { response } = await safeFetch(candidate, { headers: { accept: "application/json" } }, dependencies);
    lastStatus = response.status;
    if (!response.ok) {
      await cancelResponseBody(response);
      continue;
    }
    const metadata = await readJsonMetadata(response) as AuthorizationServerMetadata;
    if (metadata.issuer !== issuer.toString()) continue;
    if (typeof metadata.authorization_endpoint !== "string") throw new Error("ملف OAuth لا يعلن authorization_endpoint صالحًا");
    const authorizationEndpoint = normalizePublicHttpsUrl(metadata.authorization_endpoint);
    const tokenEndpoint = typeof metadata.token_endpoint === "string" ? normalizePublicHttpsUrl(metadata.token_endpoint).toString() : null;
    const registrationEndpoint = typeof metadata.registration_endpoint === "string" ? normalizePublicHttpsUrl(metadata.registration_endpoint).toString() : null;
    const pkceMethods = stringList(metadata.code_challenge_methods_supported);
    return {
      issuer: issuer.toString(),
      authorizationEndpoint: authorizationEndpoint.toString(),
      tokenEndpoint,
      registrationEndpoint,
      scopes: stringList(metadata.scopes_supported),
      grantTypes: stringList(metadata.grant_types_supported),
      supportsPkce: pkceMethods.includes("S256"),
      supportsClientMetadataDocument: metadata.client_id_metadata_document_supported === true,
    };
  }
  throw new Error(`تعذر اكتشاف خادم OAuth ${issuer.hostname} (آخر حالة HTTP: ${lastStatus || "غير متاح"})`);
}

export async function discoverMcpAuthorization(endpointValue: string, dependencies: DiscoveryDependencies = {}): Promise<McpDiscoveryResult> {
  const endpoint = normalizePublicHttpsUrl(endpointValue);
  const probe = await safeFetch(endpoint, {
    headers: { accept: "application/json, text/event-stream", "mcp-protocol-version": MCP_PROTOCOL_VERSION },
  }, dependencies);
  const challengeUrl = metadataUrlFromChallenge(probe.response.headers.get("www-authenticate"));
  const candidates = [
    challengeUrl ? { url: challengeUrl, expectedResource: endpoint } : null,
    { url: deriveProtectedResourceMetadataUrl(endpoint).toString(), expectedResource: endpoint },
    { url: new URL("/.well-known/oauth-protected-resource", endpoint.origin).toString(), expectedResource: new URL("/", endpoint.origin) },
  ].filter((value): value is { url: string; expectedResource: URL } => Boolean(value));
  let protectedMetadata: ProtectedResourceMetadata | null = null;
  let metadataUrl = "";
  let expectedResource = endpoint;
  const visited = new Set<string>();
  for (const candidate of candidates) {
    if (visited.has(candidate.url)) continue;
    visited.add(candidate.url);
    const result = await safeFetch(candidate.url, { headers: { accept: "application/json" } }, dependencies);
    if (!result.response.ok) {
      await cancelResponseBody(result.response);
      continue;
    }
    protectedMetadata = await readJsonMetadata(result.response) as ProtectedResourceMetadata;
    metadataUrl = result.url.toString();
    expectedResource = candidate.expectedResource;
    break;
  }
  if (!protectedMetadata) throw new Error("لم يعلن خادم MCP بيانات المورد المحمي المطلوبة للتفويض");
  const resource = typeof protectedMetadata.resource === "string" ? normalizePublicHttpsUrl(protectedMetadata.resource) : expectedResource;
  if (resource.toString() !== expectedResource.toString()) throw new Error("بيانات المورد المحمي لا تطابق معرّف خادم MCP");
  const issuerValues = stringList(protectedMetadata.authorization_servers, 5);
  if (issuerValues.length === 0) throw new Error("لا تعلن بيانات المورد المحمي أي خادم OAuth");
  const authorizationServers = [];
  for (const issuer of issuerValues) authorizationServers.push(await discoverAuthorizationServer(issuer, dependencies));
  return {
    endpoint: endpoint.toString(),
    resource: resource.toString(),
    metadataUrl,
    scopes: stringList(protectedMetadata.scopes_supported),
    authorizationServers,
  };
}
