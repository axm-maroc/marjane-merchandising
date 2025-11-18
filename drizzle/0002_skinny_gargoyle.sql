CREATE TABLE `planogramHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planogramId` int NOT NULL,
	`version` int NOT NULL,
	`changeType` enum('created','updated','activated','archived','restored') NOT NULL,
	`changedBy` varchar(255),
	`comment` text,
	`snapshot` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planogramHistory_id` PRIMARY KEY(`id`)
);
