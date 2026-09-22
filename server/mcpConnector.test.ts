import { describe, expect, it, vi } from "vitest";
import { deriveProtectedResourceMetadataUrl, discoverMcpAuthorization, isPublicIpAddress, normalizePublicHttpsUrl } from "./mcpConnector";

describe("MCP connector URL policy", () => {
  it("accepts only public HTTPS endpoints", () => {
    expect(normalizePublicHttpsUrl("https://mcp.example.com/api/mcp").toString()).toBe("https://mcp.example.com/api/mcp");
    expect(() => normalizePublicHttpsUrl("http://mcp.example.com")).toThrow(/HTTPS/);
    expect(() => normalizePublicHttpsUrl("https://user:secret@mcp.example.com")).toThrow(/بيانات دخول/);
    expect(() => normalizePublicHttpsUrl("https://localhost/mcp")).toThrow(/محلية/);
    expect(() => normalizePublicHttpsUrl("https://10.0.0.1/mcp")).toThrow(/خاص/);
  });

  it("rejects private and special-use IP ranges", () => {
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("127.0.0.1")).toBe(false);
    expect(isPublicIpAddress("169.254.169.254")).toBe(false);
    expect(isPublicIpAddress("192.168.1.10")).toBe(false);
    expect(isPublicIpAddress("::1")).toBe(false);
    expect(isPublicIpAddress("fd00::1")).toBe(false);
    expect(isPublicIpAddress("::ffff:c0a8:1")).toBe(false);
    expect(isPublicIpAddress("2001:db8::1")).toBe(false);
  });

  it("derives RFC 9728 metadata URLs for path-based MCP resources", () => {
    const endpoint = new URL("https://mcp.example.com/team/acme/mcp?tenant=acme");
    expect(deriveProtectedResourceMetadataUrl(endpoint).toString()).toBe("https://mcp.example.com/.well-known/oauth-protected-resource/team/acme/mcp?tenant=acme");
  });

  it("discovers RFC 9728 and OAuth metadata without receiving credentials", async () => {
    const transport = vi.fn(async (input: URL) => {
      const url = input.toString();
      if (url === "https://mcp.example.com/api/mcp") {
        return new Response(null, { status: 401, headers: { "www-authenticate": "Bearer resource_metadata=\"https://mcp.example.com/.well-known/oauth-protected-resource/api/mcp\"" } });
      }
      if (url === "https://mcp.example.com/.well-known/oauth-protected-resource/api/mcp") {
        return Response.json({ resource: "https://mcp.example.com/api/mcp", authorization_servers: ["https://auth.example.com/"], scopes_supported: ["files:read"] });
      }
      if (url === "https://auth.example.com/.well-known/oauth-authorization-server") {
        return Response.json({
          issuer: "https://auth.example.com/",
          authorization_endpoint: "https://auth.example.com/authorize",
          token_endpoint: "https://auth.example.com/token",
          scopes_supported: ["files:read"],
          grant_types_supported: ["authorization_code"],
          code_challenge_methods_supported: ["S256"],
          client_id_metadata_document_supported: true,
        });
      }
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;
    const result = await discoverMcpAuthorization("https://mcp.example.com/api/mcp", {
      transport,
      resolveIpv4: vi.fn(async () => ["8.8.8.8"]),
      resolveIpv6: vi.fn(async () => []),
    });
    expect(result.scopes).toEqual(["files:read"]);
    expect(result.authorizationServers[0]).toMatchObject({ supportsPkce: true, supportsClientMetadataDocument: true });
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it("rejects protected-resource metadata for a different path on the same origin", async () => {
    const transport = vi.fn(async (input: URL) => {
      if (input.pathname === "/api/mcp") return new Response(null, { status: 401 });
      if (input.pathname.includes("oauth-protected-resource")) {
        return Response.json({ resource: "https://mcp.example.com/other/mcp", authorization_servers: ["https://auth.example.com/"] });
      }
      return new Response(null, { status: 404 });
    });
    await expect(discoverMcpAuthorization("https://mcp.example.com/api/mcp", {
      transport,
      resolveIpv4: vi.fn(async () => ["8.8.8.8"]),
      resolveIpv6: vi.fn(async () => []),
    })).rejects.toThrow(/معرّف خادم MCP/);
  });
});
