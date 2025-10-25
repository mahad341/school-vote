var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
export var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["ADMIN"] = "admin";
    UserRole["ICT_ADMIN"] = "ict_admin";
})(UserRole || (UserRole = {}));
export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (UserStatus = {}));
let User = class User {
    // Virtual properties
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    // Methods
    canVote() {
        return this.status === UserStatus.ACTIVE && !this.hasVoted;
    }
    hasPermission(permission) {
        switch (this.role) {
            case UserRole.ICT_ADMIN:
                return true; // Full access
            case UserRole.ADMIN:
                return ['manage_posts', 'manage_candidates', 'view_results', 'manage_users'].includes(permission);
            case UserRole.STUDENT:
                return ['vote', 'view_profile', 'view_candidates'].includes(permission);
            default:
                return false;
        }
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', unique: true, length: 20 }),
    __metadata("design:type", String)
], User.prototype, "studentId", void 0);
__decorate([
    Column({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    Column({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    Column({ type: 'varchar', unique: true, length: 255 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STUDENT
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true, length: 50 }),
    __metadata("design:type", String)
], User.prototype, "house", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true, length: 20 }),
    __metadata("design:type", String)
], User.prototype, "class", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "hasVoted", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "votedAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    OneToMany('Vote', 'user'),
    __metadata("design:type", Array)
], User.prototype, "votes", void 0);
__decorate([
    OneToMany('AuditLog', 'user'),
    __metadata("design:type", Array)
], User.prototype, "auditLogs", void 0);
User = __decorate([
    Entity('users')
], User);
export { User };
