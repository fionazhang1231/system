/** 手机号校验工具 */

// 大陆手机号：1开头，11位数字
export const isMainlandPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

// 香港手机号：8位数字，以5/6/9开头
export const isHongKongPhone = (phone: string): boolean => {
  return /^[569]\d{7}$/.test(phone);
};

// 澳门手机号：8位数字，以6开头
export const isMacauPhone = (phone: string): boolean => {
  return /^6\d{7}$/.test(phone);
};

// 校验手机号（支持大陆、香港、澳门）
export const isValidPhone = (phone: string): boolean => {
  return isMainlandPhone(phone) || isHongKongPhone(phone) || isMacauPhone(phone);
};

// 获取手机号提示信息
export const getPhoneHint = (): string => {
  return '支持大陆11位 / 香港澳门8位手机号';
};

// 手机号区号选项
export const phoneRegionOptions = [
  { label: '+86 中国大陆', value: '+86' },
  { label: '+852 中国香港', value: '+852' },
  { label: '+853 中国澳门', value: '+853' },
];

// 根据区号获取校验函数
export const getPhoneValidator = (region: string) => {
  switch (region) {
    case '+86':
      return isMainlandPhone;
    case '+852':
      return isHongKongPhone;
    case '+853':
      return isMacauPhone;
    default:
      return isValidPhone;
  }
};

// 根据区号获取手机号长度
export const getPhoneMaxLength = (region: string): number => {
  switch (region) {
    case '+86':
      return 11;
    case '+852':
    case '+853':
      return 8;
    default:
      return 11;
  }
};

// 根据区号获取提示文案
export const getPhonePlaceholder = (region: string): string => {
  switch (region) {
    case '+86':
      return '请输入11位大陆手机号';
    case '+852':
      return '请输入8位香港手机号';
    case '+853':
      return '请输入8位澳门手机号';
    default:
      return '请输入手机号';
  }
};
