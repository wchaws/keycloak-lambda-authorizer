jest.mock('../../src/clientAuthorization');

jest.mock('../../src/utils/restCalls');
const restCalls = require('../../src/utils/restCalls');

const { enforce } = require('../../src/umaConfiguration');
const { clientAuthentication } = require('../../src/clientAuthorization');

const cache = {
  get: async () => null,
  put: async () => {},
};

const token = {
  payload: {
    realm_access: {
      roles: [
        'accessRole',
      ],
    },
    authorization: {
      permissions: [{ rsid: 'resourceId' }],
    },
  },
};

const keycloakJson = () => ({
  realm: 'lambda-authorizer',
  'auth-server-url': 'http://localhost:8090/auth',
  'ssl-required': 'external',
  resource: 'lambda',
  'verify-token-audience': true,
  credentials: {
    secret: '772decbe-0151-4b08-8171-bec6d097293b',
  },
  'confidential-port': 0,
  'policy-enforcer': {},
});

describe('testing umaConfiguration', () => {
  beforeEach(() => {
    restCalls.fetchData.mockImplementation(async (url) => {
      if (url === 'http://localhost:8090/auth/realms/lambda-authorizer/.well-known/uma2-configuration') {
        return JSON.stringify({ resource_registration_endpoint: 'resourceEndpoint' });
      }
      if (url === 'resourceEndpoint?name=resource&uri=/test&matchingUri=true&owner=undefined&type=undefined&scope=undefined&deep=undefined&first=undefined&max=undefined') {
        return JSON.stringify(['resourceId']);
      }
      if (url === 'resourceEndpoint?name=deniedResource&uri=/test&matchingUri=true&owner=undefined&type=undefined&scope=undefined&deep=undefined&first=undefined&max=undefined') {
        return JSON.stringify(['resourceId2']);
      }

      throw new Error(`unsupported Url: ${url}`);
    });
    restCalls.getKeycloakUrl.mockImplementation(() => 'http://localhost:8090/auth');
    clientAuthentication.mockImplementation(async () => ({ access_token: 'access_token' }));
  });

  afterEach(() => {
  });

  test('test enforceRole success', async () => {
    await enforce(token, {
      keycloakJson,
      enforce: {
        enabled: true,
        role: 'accessRole',
      },
    });
  });

  test('test enforceRole failed', async () => {
    try {
      await enforce(token, {
        keycloakJson,
        enforce: {
          enabled: true,
          role: 'someRole',
        },
      });
      throw new Error('unexpected status');
    } catch (e) {
      expect(e.message).toEqual('Access Denied');
    }
  });

  test('test enforceResource success', async () => {
    await enforce(token, {
      cache,
      keycloakJson,
      enforce: {
        enabled: true,
        resource: {
          name: 'resource',
          uri: '/test',
          matchingUri: true,
        },
      },
    });
  });

  test('test enforceResource Handler success', async () => {
    await enforce(token, {
      cache,
      keycloakJson,
      enforce: {
        enabled: true,
        resource: {
          name: 'resource',
          uri: '/test',
          matchingUri: true,
        },
        resourceHandler: (resourceJson) => {
          expect(resourceJson).toEqual(['resourceId']);
        },
      },
    });
  });

  test('test enforceResource denied', async () => {
    try {
      await enforce(token, {
        cache,
        keycloakJson,
        enforce: {
          enabled: true,
          resource: {
            name: 'deniedResource',
            uri: '/test',
            matchingUri: true,
          },
        },
      });
      throw new Error('unexpected status');
    } catch (e) {
      expect(e.message).toEqual('Access is denied');
    }
  });
});
