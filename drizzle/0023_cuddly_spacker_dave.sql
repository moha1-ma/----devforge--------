CREATE TABLE `miniWorkstationPaths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`stationKey` varchar(48) NOT NULL,
	`request` text NOT NULL,
	`headline` varchar(240) NOT NULL,
	`outputJson` text NOT NULL,
	`model` varchar(120) NOT NULL,
	`reviewStatus` enum('completed','reviewed','archived') NOT NULL DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `miniWorkstationPaths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `miniWorkstationPaths` ADD CONSTRAINT `miniWorkstationPaths_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mini_workstation_owner_status_idx` ON `miniWorkstationPaths` (`ownerId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `mini_workstation_owner_station_idx` ON `miniWorkstationPaths` (`ownerId`,`stationKey`);