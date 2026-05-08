export interface CustomerUser {
  id?: number;
  user_id?: number;
  name?: string;
  phone: string;
  email?: string;
}

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  message?: string;
  success?: boolean;
  status?: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  authToken: string;
  token?: string;
  user?: CustomerUser;
  message?: string;
  success?: boolean;
  status?: string;
}
