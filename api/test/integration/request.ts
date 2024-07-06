import Axios, { AxiosResponse } from 'axios';

const baseUrl = 'https://example.com';
// const baseUrl = 'http://localhost:3000';

export const axios = Axios.create({
  validateStatus: () => true,
});

function url(path: string, queryParameters?: Record<string, unknown>) {
  return `${baseUrl}${path}?${new URLSearchParams({ test: 'true', ...queryParameters })}`;
}

export function get(path: string, queryParameters?: Record<string, unknown>): Promise<AxiosResponse> {
  return axios.get(url(path, queryParameters));
}

export function put(path: string, body: unknown): Promise<AxiosResponse> {
  return axios.put(url(path), JSON.stringify(body));
}

export function post(path: string, body: unknown): Promise<AxiosResponse> {
  return axios.post(url(path), JSON.stringify(body));
}

export function del(path: string, queryParameters?: Record<string, unknown>): Promise<AxiosResponse> {
  return axios.delete(url(path, queryParameters));
}
