import request from './request';

const apiUser = '/api/user';

// export const loginUser = async (data) => {
//     const res = await request.post('/api/user/login', data);
//     return res.data;
// };
import { apiClient } from './axiosClient';

export const requestLogin = async (data) => {
    const res = await request.post(`${apiUser}/login`, data);
    return res.data;
};

export const requestRegister = async (data) => {
    const res = await request.post(`${apiUser}/register`, data);
    return res.data;
};

export const requestForgotPassword = async (data) => {
    const res = await request.post(`${apiUser}/forgot-password`, data);
    return res.data;
};

export const requestVerifyForgotPassword = async (data) => {
    const res = await request.post(`${apiUser}/verify-forgot-password`, data);
    return res.data;
};

export const requestLogout = async () => {
    const res = await apiClient.get(`${apiUser}/logout`);
    return res.data;
};

export const requestAuth = async () => {
    const res = await apiClient.get(`${apiUser}/auth`);
    return res.data;
};

export const requestRefreshToken = async () => {
    const res = await request.get(`${apiUser}/refresh-token`);
    return res.data;
};
