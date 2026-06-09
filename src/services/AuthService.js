import { publicAxios } from "../AxiosInstances";

export const LoginService = async ({ email, otp }) => {
    const payload = {};
    if (email) payload.email = email;
    if (otp) payload.otp = otp;
    const response = await publicAxios.post("/auth/login", payload);
    return response.data;
};

export const SendOtp = async ({ email }) => {
    const payload = {};
    if (email) payload.email = email;
    await publicAxios.post("/auth/otp", payload);
};
