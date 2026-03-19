CREATE TYPE "public"."victory_type" AS ENUM('dominance', 'wonder', 'points');--> statement-breakpoint
CREATE TYPE "public"."world_speed" AS ENUM('standard', 'speed', 'casual');--> statement-breakpoint
CREATE TYPE "public"."world_status" AS ENUM('open', 'active', 'ended');--> statement-breakpoint
CREATE TYPE "public"."terrain_type" AS ENUM('standard', 'fertile', 'rocky', 'coastal');--> statement-breakpoint
CREATE TYPE "public"."building_type" AS ENUM('farm', 'lumber_mill', 'quarry', 'market', 'barracks', 'stable', 'siege_workshop', 'harbor', 'wall', 'senate', 'academy', 'warehouse', 'tavern', 'temple');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('swordsman', 'hoplite', 'archer', 'scout', 'horseman', 'cataphract', 'battering_ram', 'catapult', 'trebuchet', 'scout_ship', 'warship', 'transport', 'fire_ship', 'colonist', 'spy');--> statement-breakpoint
CREATE TYPE "public"."alliance_role" AS ENUM('founder', 'leader', 'officer', 'member');--> statement-breakpoint
CREATE TYPE "public"."diplomacy_status" AS ENUM('pending', 'active', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."diplomacy_type" AS ENUM('nap', 'trade', 'alliance', 'war');--> statement-breakpoint
CREATE TYPE "public"."army_status" AS ENUM('marching', 'arrived', 'returning', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."army_type" AS ENUM('attack', 'raid', 'support', 'return', 'colony');--> statement-breakpoint
CREATE TYPE "public"."battle_outcome" AS ENUM('attacker_victory', 'defender_victory', 'draw');--> statement-breakpoint
CREATE TYPE "public"."battle_type" AS ENUM('attack', 'raid', 'naval');--> statement-breakpoint
CREATE TYPE "public"."research_type" AS ENUM('improved_farming', 'advanced_mining', 'trading_routes', 'double_construction', 'iron_swords', 'hardened_shields', 'cavalry_training', 'advanced_siege', 'shipbuilding', 'naval_tactics', 'troop_transport', 'basic_espionage', 'counter_intelligence', 'advanced_intelligence', 'efficient_administration', 'city_planning', 'colonization');--> statement-breakpoint
CREATE TYPE "public"."spy_mission_status" AS ENUM('in_progress', 'success', 'detected');--> statement-breakpoint
CREATE TYPE "public"."spy_mission_type" AS ENUM('scout_resources', 'scout_army', 'scout_buildings', 'full_report', 'sabotage');--> statement-breakpoint
CREATE TABLE "worlds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"speed" "world_speed" DEFAULT 'standard' NOT NULL,
	"status" "world_status" DEFAULT 'open' NOT NULL,
	"victory_type" "victory_type" DEFAULT 'dominance' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "islands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"terrain_type" "terrain_type" DEFAULT 'standard' NOT NULL,
	"food_bonus" integer DEFAULT 0 NOT NULL,
	"wood_bonus" integer DEFAULT 0 NOT NULL,
	"stone_bonus" integer DEFAULT 0 NOT NULL,
	"max_cities" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"world_id" uuid NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"island_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_capital" boolean DEFAULT false NOT NULL,
	"morale" integer DEFAULT 100 NOT NULL,
	"population" integer DEFAULT 100 NOT NULL,
	"population_cap" integer DEFAULT 500 NOT NULL,
	"wall_level" integer DEFAULT 0 NOT NULL,
	"food" numeric(12, 2) DEFAULT '0' NOT NULL,
	"wood" numeric(12, 2) DEFAULT '0' NOT NULL,
	"stone" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gold" numeric(12, 2) DEFAULT '0' NOT NULL,
	"last_resource_snapshot_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"type" "building_type" NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"is_upgrading" boolean DEFAULT false NOT NULL,
	"upgrade_started_at" timestamp,
	"upgrade_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_queues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"unit_type" "unit_type" NOT NULL,
	"count" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"type" "unit_type" NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alliance_diplomacy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alliance_id" uuid NOT NULL,
	"target_alliance_id" uuid NOT NULL,
	"type" "diplomacy_type" NOT NULL,
	"status" "diplomacy_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alliance_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alliance_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"role" "alliance_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alliances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"tag" varchar(5) NOT NULL,
	"description" text,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "armies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"owner_player_id" uuid NOT NULL,
	"origin_city_id" uuid NOT NULL,
	"target_city_id" uuid NOT NULL,
	"type" "army_type" NOT NULL,
	"status" "army_status" DEFAULT 'marching' NOT NULL,
	"departure_at" timestamp DEFAULT now() NOT NULL,
	"arrival_at" timestamp NOT NULL,
	"return_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "army_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"army_id" uuid NOT NULL,
	"type" "unit_type" NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"army_id" uuid NOT NULL,
	"attacker_player_id" uuid NOT NULL,
	"defender_player_id" uuid,
	"city_id" uuid NOT NULL,
	"type" "battle_type" NOT NULL,
	"outcome" "battle_outcome" NOT NULL,
	"resources_looted" jsonb,
	"resolved_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"type" "research_type" NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"is_researching" boolean DEFAULT false NOT NULL,
	"research_started_at" timestamp,
	"research_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spy_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_player_id" uuid NOT NULL,
	"target_city_id" uuid NOT NULL,
	"mission_type" "spy_mission_type" NOT NULL,
	"status" "spy_mission_status" DEFAULT 'in_progress' NOT NULL,
	"result" jsonb,
	"departure_at" timestamp DEFAULT now() NOT NULL,
	"arrival_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alliance_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "islands" ADD CONSTRAINT "islands_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_island_id_islands_id_fk" FOREIGN KEY ("island_id") REFERENCES "public"."islands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_queues" ADD CONSTRAINT "unit_queues_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alliance_diplomacy" ADD CONSTRAINT "alliance_diplomacy_alliance_id_alliances_id_fk" FOREIGN KEY ("alliance_id") REFERENCES "public"."alliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alliance_diplomacy" ADD CONSTRAINT "alliance_diplomacy_target_alliance_id_alliances_id_fk" FOREIGN KEY ("target_alliance_id") REFERENCES "public"."alliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alliance_members" ADD CONSTRAINT "alliance_members_alliance_id_alliances_id_fk" FOREIGN KEY ("alliance_id") REFERENCES "public"."alliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alliance_members" ADD CONSTRAINT "alliance_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armies" ADD CONSTRAINT "armies_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armies" ADD CONSTRAINT "armies_owner_player_id_players_id_fk" FOREIGN KEY ("owner_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armies" ADD CONSTRAINT "armies_origin_city_id_cities_id_fk" FOREIGN KEY ("origin_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armies" ADD CONSTRAINT "armies_target_city_id_cities_id_fk" FOREIGN KEY ("target_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "army_units" ADD CONSTRAINT "army_units_army_id_armies_id_fk" FOREIGN KEY ("army_id") REFERENCES "public"."armies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_army_id_armies_id_fk" FOREIGN KEY ("army_id") REFERENCES "public"."armies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_attacker_player_id_players_id_fk" FOREIGN KEY ("attacker_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_defender_player_id_players_id_fk" FOREIGN KEY ("defender_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research" ADD CONSTRAINT "research_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research" ADD CONSTRAINT "research_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spy_missions" ADD CONSTRAINT "spy_missions_sender_player_id_players_id_fk" FOREIGN KEY ("sender_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spy_missions" ADD CONSTRAINT "spy_missions_target_city_id_cities_id_fk" FOREIGN KEY ("target_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_alliance_id_alliances_id_fk" FOREIGN KEY ("alliance_id") REFERENCES "public"."alliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_players_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_islands_world_coords" ON "islands" USING btree ("world_id","x","y");--> statement-breakpoint
CREATE INDEX "idx_islands_world_id" ON "islands" USING btree ("world_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_players_user_world" ON "players" USING btree ("user_id","world_id");--> statement-breakpoint
CREATE INDEX "idx_players_world_id" ON "players" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_players_user_id" ON "players" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cities_player_id" ON "cities" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_cities_island_id" ON "cities" USING btree ("island_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_buildings_city_type" ON "buildings" USING btree ("city_id","type");--> statement-breakpoint
CREATE INDEX "idx_buildings_city_id" ON "buildings" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_unit_queues_city_id" ON "unit_queues" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_unit_queues_ends_at" ON "unit_queues" USING btree ("ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_units_city_type" ON "units" USING btree ("city_id","type");--> statement-breakpoint
CREATE INDEX "idx_units_city_id" ON "units" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_diplomacy_unique" ON "alliance_diplomacy" USING btree ("alliance_id","target_alliance_id","type");--> statement-breakpoint
CREATE INDEX "idx_diplomacy_alliance_id" ON "alliance_diplomacy" USING btree ("alliance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_alliance_members_player" ON "alliance_members" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_alliance_members_alliance_id" ON "alliance_members" USING btree ("alliance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_alliances_world_tag" ON "alliances" USING btree ("world_id","tag");--> statement-breakpoint
CREATE INDEX "idx_alliances_world_id" ON "alliances" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_armies_world_id" ON "armies" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_armies_owner_player_id" ON "armies" USING btree ("owner_player_id");--> statement-breakpoint
CREATE INDEX "idx_armies_arrival_at" ON "armies" USING btree ("arrival_at");--> statement-breakpoint
CREATE INDEX "idx_armies_target_city_id" ON "armies" USING btree ("target_city_id");--> statement-breakpoint
CREATE INDEX "idx_army_units_army_id" ON "army_units" USING btree ("army_id");--> statement-breakpoint
CREATE INDEX "idx_battles_world_id" ON "battles" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_battles_attacker" ON "battles" USING btree ("attacker_player_id");--> statement-breakpoint
CREATE INDEX "idx_battles_defender" ON "battles" USING btree ("defender_player_id");--> statement-breakpoint
CREATE INDEX "idx_battles_city_id" ON "battles" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_research_player_type" ON "research" USING btree ("player_id","type");--> statement-breakpoint
CREATE INDEX "idx_research_player_id" ON "research" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_spy_missions_sender" ON "spy_missions" USING btree ("sender_player_id");--> statement-breakpoint
CREATE INDEX "idx_spy_missions_target" ON "spy_missions" USING btree ("target_city_id");--> statement-breakpoint
CREATE INDEX "idx_spy_missions_arrival" ON "spy_missions" USING btree ("arrival_at");--> statement-breakpoint
CREATE INDEX "idx_messages_alliance_created" ON "messages" USING btree ("alliance_id","created_at");