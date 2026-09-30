import { apiClient } from './axiosClient';

const apiPayment = '/api/payment';

export const requestPayment = async (data) => {
    const response = await apiClient.post(`${apiPayment}/create`, data);
    return response.data;
};

export const requestPaymentById = async (orderId) => {
    const response = await apiClient.get(`${apiPayment}/order/${orderId}`);
    return response.data;
};

export const requestMyPayments = async () => {
    const response = await apiClient.get(`${apiPayment}/my-orders`);
    return response.data;
};
