var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLog_1;
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
export var AuditAction;
(function (AuditAction) {
    // Authentication
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["PASSWORD_CHANGE"] = "password_change";
    // User Management
    AuditAction["USER_CREATE"] = "user_create";
    AuditAction["USER_UPDATE"] = "user_update";
    AuditAction["USER_DELETE"] = "user_delete";
    AuditAction["USER_IMPORT"] = "user_import";
    // Election Management
    AuditAction["POST_CREATE"] = "post_create";
    AuditAction["POST_UPDATE"] = "post_update";
    AuditAction["POST_DELETE"] = "post_delete";
    AuditAction["POST_ACTIVATE"] = "post_activate";
    AuditAction["POST_DEACTIVATE"] = "post_deactivate";
    // Candidate Management
    AuditAction["CANDIDATE_CREATE"] = "candidate_create";
    AuditAction["CANDIDATE_UPDATE"] = "candidate_update";
    AuditAction["CANDIDATE_DELETE"] = "candidate_delete";
    AuditAction["CANDIDATE_PHOTO_UPLOAD"] = "candidate_photo_upload";
    // Voting
    AuditAction["VOTE_CAST"] = "vote_cast";
    AuditAction["VOTE_VERIFY"] = "vote_verify";
    AuditAction["VOTE_INVALIDATE"] = "vote_invalidate";
    // System
    AuditAction["SYSTEM_BACKUP"] = "system_backup";
    AuditAction["SYSTEM_RESTORE"] = "system_restore";
    AuditAction["SYSTEM_RESET"] = "system_reset";
    AuditAction["SYSTEM_STATUS_CHANGE"] = "system_status_change";
    // Security
    AuditAction["FAILED_LOGIN"] = "failed_login";
    AuditAction["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
})(AuditAction || (AuditAction = {}));
export var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "low";
    AuditSeverity["MEDIUM"] = "medium";
    AuditSeverity["HIGH"] = "high";
    AuditSeverity["CRITICAL"] = "critical";
})(AuditSeverity || (AuditSeverity = {}));
let AuditLog = AuditLog_1 = class AuditLog {
    // Virtual properties
    get isSecurityEvent() {
        return [
            AuditAction.FAILED_LOGIN,
            AuditAction.SUSPICIOUS_ACTIVITY,
            AuditAction.PASSWORD_CHANGE
        ].includes(this.action);
    }
    get isVotingEvent() {
        return [
            AuditAction.VOTE_CAST,
            AuditAction.VOTE_VERIFY,
            AuditAction.VOTE_INVALIDATE
        ].includes(this.action);
    }
    // Methods
    static createLog(params) {
        const log = new AuditLog_1();
        log.action = params.action;
        log.userId = params.userId;
        log.description = params.description;
        log.details = params.details;
        log.ipAddress = params.ipAddress;
        log.userAgent = params.userAgent;
        log.resourceId = params.resourceId;
        log.resourceType = params.resourceType;
        log.oldValues = params.oldValues;
        log.newValues = params.newValues;
        log.severity = params.severity || AuditSeverity.LOW;
        return log;
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: AuditAction
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: AuditSeverity,
        default: AuditSeverity.LOW
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "severity", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "description", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "details", void 0);
__decorate([
    Column({ type: 'inet', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    Column({ length: 500, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    Column({ name: 'userId', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
__decorate([
    ManyToOne('User', 'auditLogs', { onDelete: 'SET NULL' }),
    JoinColumn({ name: 'userId' }),
    __metadata("design:type", Function)
], AuditLog.prototype, "user", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceType", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "oldValues", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "newValues", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
AuditLog = AuditLog_1 = __decorate([
    Entity('audit_logs'),
    Index(['userId', 'createdAt']),
    Index(['action', 'createdAt']),
    Index(['severity', 'createdAt'])
], AuditLog);
export { AuditLog };
