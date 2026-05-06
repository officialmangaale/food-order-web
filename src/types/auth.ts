export interface CustomerUser {
  id?: number;
  name?: string;
  phone: string;
  email?: string;
}

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  message: string;
  success: boolean;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: CustomerUser;
  message?: string;
}
