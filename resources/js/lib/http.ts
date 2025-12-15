import axios from "axios";

const csrf =
  (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)
    ?.content || "";

const http = axios.create({
  baseURL: "/", // same domain
  withCredentials: true, // send cookies (session)
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
  },
});

export default http;
