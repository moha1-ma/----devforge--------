CREATE TABLE `communities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`status` enum('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
	`moderatorId` int,
	`moderationNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`status` enum('pending','approved','rejected','blocked') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`moderationNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityMemberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `comm_member_unique` UNIQUE(`communityId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `communityPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`content` text NOT NULL,
	`status` enum('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`moderationNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('community','post','member') NOT NULL,
	`targetId` int NOT NULL,
	`reason` varchar(500) NOT NULL,
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`handlerId` int,
	`resolutionNote` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alias` varchar(48) NOT NULL,
	`bio` varchar(500),
	`skills` varchar(240),
	`discoveryEnabled` boolean NOT NULL DEFAULT false,
	`status` enum('active','restricted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `member_profile_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `communities` ADD CONSTRAINT `comm_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communities` ADD CONSTRAINT `comm_mod_fk` FOREIGN KEY (`moderatorId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityMemberships` ADD CONSTRAINT `cm_comm_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityMemberships` ADD CONSTRAINT `cm_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityMemberships` ADD CONSTRAINT `cm_reviewer_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityPosts` ADD CONSTRAINT `cp_comm_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityPosts` ADD CONSTRAINT `cp_author_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityPosts` ADD CONSTRAINT `cp_reviewer_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityReports` ADD CONSTRAINT `cr_reporter_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `communityReports` ADD CONSTRAINT `cr_handler_fk` FOREIGN KEY (`handlerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberProfiles` ADD CONSTRAINT `mp_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;