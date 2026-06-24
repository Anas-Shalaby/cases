-- إضافة أنواع سجل أنشطة لتعديل وحذف المستخدمين
ALTER TYPE log_action_type ADD VALUE IF NOT EXISTS 'update_user';
ALTER TYPE log_action_type ADD VALUE IF NOT EXISTS 'delete_user';
