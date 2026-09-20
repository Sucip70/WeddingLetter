import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { parseBody } from '../auth/auth.dto.js';
import { AuthGuard, CurrentUser, Roles } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { MaintenanceService } from '../jobs/maintenance.service.js';
import {
  addOnUpdateSchema,
  assetPresignSchema,
  couponCreateSchema,
  couponUpdateSchema,
  extendSchema,
  listQuerySchema,
  markPaidSchema,
  refundSchema,
  resumeSchema,
  setExpirySchema,
  templateCreateSchema,
  templateUpdateSchema,
  userRoleSchema,
} from './admin.dto.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(AuthGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly maintenance: MaintenanceService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  // ----- Template builder -----
  @Get('builder-meta')
  builderMeta() {
    return this.admin.builderMeta();
  }

  @Get('templates')
  listTemplates() {
    return this.admin.listTemplates();
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.admin.getTemplate(id);
  }

  @Post('templates')
  createTemplate(@Body() body: unknown) {
    return this.admin.createTemplate(parseBody(templateCreateSchema, body));
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.updateTemplate(id, parseBody(templateUpdateSchema, body));
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.admin.deleteTemplate(id);
  }

  @Post('assets/presign')
  @HttpCode(200)
  presignAsset(@Body() body: unknown) {
    return this.admin.presignAsset(parseBody(assetPresignSchema, body));
  }

  // ----- Harga per komponen -----
  @Get('add-ons')
  listAddOns() {
    return this.admin.listAddOns();
  }

  @Patch('add-ons/:id')
  updateAddOn(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.updateAddOn(id, parseBody(addOnUpdateSchema, body));
  }

  // ----- Kupon -----
  @Get('coupons')
  listCoupons() {
    return this.admin.listCoupons();
  }

  @Post('coupons')
  createCoupon(@Body() body: unknown) {
    return this.admin.createCoupon(parseBody(couponCreateSchema, body));
  }

  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.updateCoupon(id, parseBody(couponUpdateSchema, body));
  }

  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.admin.deleteCoupon(id);
  }

  // ----- Pesanan -----
  @Get('orders')
  listOrders(@Query() query: unknown) {
    return this.admin.listOrders(parseBody(listQuerySchema, query));
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.admin.getOrder(id);
  }

  @Post('orders/:id/mark-paid')
  @HttpCode(200)
  markPaid(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.markOrderPaid(id, parseBody(markPaidSchema, body ?? {}).note);
  }

  @Post('orders/:id/refund')
  @HttpCode(200)
  refund(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.refundOrder(id, parseBody(refundSchema, body ?? {}).force);
  }

  // ----- Undangan -----
  @Get('invitations')
  listInvitations(@Query() query: unknown) {
    return this.admin.listInvitations(parseBody(listQuerySchema, query));
  }

  @Get('invitations/:id')
  getInvitation(@Param('id') id: string) {
    return this.admin.getInvitation(id);
  }

  @Post('invitations/:id/pause')
  @HttpCode(200)
  pause(@Param('id') id: string) {
    return this.admin.pauseInvitation(id);
  }

  @Post('invitations/:id/resume')
  @HttpCode(200)
  resume(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.resumeInvitation(id, parseBody(resumeSchema, body ?? {}).extraDays);
  }

  @Post('invitations/:id/extend')
  @HttpCode(200)
  extend(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.extendInvitation(id, parseBody(extendSchema, body).weeks);
  }

  @Post('invitations/:id/expiry')
  @HttpCode(200)
  setExpiry(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.setExpiry(id, parseBody(setExpirySchema, body).expiresAt);
  }

  @Delete('invitations/:id')
  deleteInvitation(@Param('id') id: string) {
    return this.admin.deleteInvitation(id);
  }

  // ----- Pengguna -----
  @Get('users')
  listUsers(@Query() query: unknown) {
    return this.admin.listUsers(parseBody(listQuerySchema, query));
  }

  @Patch('users/:id/role')
  setRole(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.admin.setUserRole(actor.id, id, parseBody(userRoleSchema, body).role);
  }

  // ----- Pemeliharaan -----
  @Post('maintenance/run')
  @HttpCode(200)
  runMaintenance() {
    return this.maintenance.run();
  }
}
