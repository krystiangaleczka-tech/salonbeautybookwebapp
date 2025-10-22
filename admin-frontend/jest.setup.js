import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Dodatkowe globalne mocki dla Firebase
global.fetch = fetch;
global.Request = Request;
global.Response = Response;
global.Headers = Headers;