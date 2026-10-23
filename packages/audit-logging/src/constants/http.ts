export const HTTP_METHODS = ['GET', 'POST', 'DELETE', 'PUT', 'HEAD', 'CONNECT', 'OPTIONS', 'TRACE'];
export const HTTP_STATUS_CODES = [
  [100, 'Continue'],
  [101, 'Switching protocols'],
  [102, 'Processing'],
  [103, 'Early hints'],
  [200, 'OK'],
  [201, 'Created'],
  [202, 'Accepted'],
  [203, 'Non-authoritative information'],
  [204, 'No content'],
  [205, 'Reset content'],
  [206, 'Partial content'],
  [207, 'Multi-status'],
  [208, 'Already reported'],
  [226, 'IM used'],
  [300, 'Multiple choices'],
  [301, 'Moved permanently'],
  [302, 'Found'],
  [303, 'See other'],
  [304, 'Not modified'],
  [305, 'Use proxy'],
  [306, 'Switch proxy'],
  [307, 'Temporary redirect'],
  [308, 'Permanent redirect'],
  [400, 'Bad request'],
  [401, 'Unauthorized'],
  [402, 'Payment required'],
  [403, 'Forbidden'],
  [404, 'Not found'],
  [405, 'Method not allowed'],
  [406, 'Not acceptable'],
  [407, 'Proxy authentication required'],
  [408, 'Request timeout'],
  [409, 'Conflict'],
  [410, 'Gone'],
  [411, 'Length required'],
  [412, 'Precondition failed'],
  [413, 'Payload too large'],
  [414, 'URI too long'],
  [415, 'Unsupported media type'],
  [416, 'Range not satisfiable'],
  [417, 'Expectation failed'],
  [421, 'Misdirected request'],
  [423, 'Locked'],
  [424, 'Failed dependency'],
  [426, 'Upgrade required'],
  [428, 'Precondition required'],
  [429, 'Too many requests'],
  [431, 'Request header fields too large'],
  [451, 'Unavailable for legal reasons'],
  [500, 'Internal server error'],
  [501, 'Not implemented'],
  [502, 'Bad gateway'],
  [503, 'Service unavailable'],
  [504, 'Gateway timeout'],
  [505, 'HTTP version not supported'],
  [506, 'Variant also negotiates'],
  [507, 'Insufficient storage'],
  [508, 'Loop detected'],
  [510, 'Not extended'],
  [511, 'Network authentication required'],
].map(([code, message]) => ({ code: Number(code), message: String(message) }));

export function httpStatusClass(code?: number | null): string {
  if (code === undefined || code === null) return 'text-bg-secondary';
  return code >= 500
    ? 'text-bg-danger'
    : code >= 400
      ? 'text-bg-warning'
      : code >= 300
        ? 'text-bg-info'
        : code >= 200
          ? 'text-bg-success'
          : 'text-bg-secondary';
}

export function httpMethodClass(method?: string): string {
  return method === 'GET'
    ? 'text-bg-success'
    : method === 'DELETE'
      ? 'text-bg-danger'
      : method === 'POST'
        ? 'text-bg-primary'
        : 'text-bg-secondary';
}
