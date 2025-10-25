var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
export var BackupStatus;
(function (BackupStatus) {
    BackupStatus["PENDING"] = "pending";
    BackupStatus["IN_PROGRESS"] = "in_progress";
    BackupStatus["COMPLETED"] = "completed";
    BackupStatus["FAILED"] = "failed";
})(BackupStatus || (BackupStatus = {}));
export var BackupType;
(function (BackupType) {
    BackupType["FULL"] = "full";
    BackupType["INCREMENTAL"] = "incremental";
    BackupType["VOTES_ONLY"] = "votes_only";
})(BackupType || (BackupType = {}));
let Backup = class Backup {
    // Virtual properties
    get duration() {
        if (this.startedAt && this.completedAt) {
            return this.completedAt.getTime() - this.startedAt.getTime();
        }
        return null;
    }
    get isCompleted() {
        return this.status === BackupStatus.COMPLETED;
    }
    get isFailed() {
        return this.status === BackupStatus.FAILED;
    }
    // Methods
    start() {
        this.status = BackupStatus.IN_PROGRESS;
        this.startedAt = new Date();
    }
    complete() {
        this.status = BackupStatus.COMPLETED;
        this.completedAt = new Date();
    }
    fail(errorMessage) {
        this.status = BackupStatus.FAILED;
        this.completedAt = new Date();
        this.errorMessage = errorMessage;
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Backup.prototype, "id", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Backup.prototype, "filename", void 0);
__decorate([
    Column({ length: 500 }),
    __metadata("design:type", String)
], Backup.prototype, "filePath", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: BackupType,
        default: BackupType.FULL
    }),
    __metadata("design:type", String)
], Backup.prototype, "type", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: BackupStatus,
        default: BackupStatus.PENDING
    }),
    __metadata("design:type", String)
], Backup.prototype, "status", void 0);
__decorate([
    Column({ type: 'numeric' }),
    __metadata("design:type", Number)
], Backup.prototype, "fileSize", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Backup.prototype, "description", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Backup.prototype, "metadata", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Backup.prototype, "startedAt", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Backup.prototype, "completedAt", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Backup.prototype, "initiatedBy", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Backup.prototype, "errorMessage", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Backup.prototype, "createdAt", void 0);
Backup = __decorate([
    Entity('backups')
], Backup);
export { Backup };
