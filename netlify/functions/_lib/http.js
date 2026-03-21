"use strict";

const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: Object.assign({
      "Content-Type": "application/json; charset=utf-8"
    }, BASE_HEADERS),
    body: JSON.stringify(body)
  };
}

function noContent(statusCode) {
  return {
    statusCode: typeof statusCode === "number" ? statusCode : 204,
    headers: Object.assign({
      "Content-Type": "text/plain; charset=utf-8"
    }, BASE_HEADERS),
    body: ""
  };
}

async function readJsonBody(event) {
  if (!event.body) {
    return {};
  }
  return JSON.parse(event.body);
}

module.exports = {
  json,
  noContent,
  readJsonBody
};
