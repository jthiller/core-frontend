import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import assert from 'assert-diff'
import moxios from 'moxios'
import sinon from 'sinon'
import * as actions from '../../../modules/integrationKey/actions'
import * as web3Provider from '../../../utils/web3Provider'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('IntegrationKey actions', () => {
    let store
    let sandbox

    beforeEach(() => {
        moxios.install()
        sandbox = sinon.createSandbox()
        store = mockStore({
            integrationKeys: [],
            error: null,
            fetching: false,
        })
        jest.resetModules()
    })

    afterEach(() => {
        moxios.uninstall()
        store.clearActions()
        sandbox.reset()
        sandbox.restore()
    })

    describe('createIdentity', () => {
        it('creates CREATE_IDENTITY_SUCCESS when creating identity has succeeded', async () => {
            const signSpy = sandbox.stub().callsFake((challenge, account) => Promise.resolve(`${challenge}SignedBy${account}`))
            const acc = 'testAccount'
            sandbox.stub(web3Provider, 'default').callsFake(() => ({
                isEnabled: () => true,
                getDefaultAccount: () => Promise.resolve(acc),
                eth: {
                    personal: {
                        sign: signSpy,
                    },
                },
            }))

            moxios.promiseWait()
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'post')

                    assert.equal(request.url, `${process.env.STREAMR_API_URL}/login/challenge/${acc}`)
                    request.respondWith({
                        status: 200,
                        response: {
                            id: 'moi',
                            challenge: 'testChallenge',
                        },
                    })
                    return moxios.promiseWait()
                })
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'post')
                    assert.equal(request.url, `${process.env.STREAMR_API_URL}/integration_keys`)
                    assert(signSpy.calledOnce)
                    assert(signSpy.calledWith('testChallenge'))
                    request.respondWith({
                        status: 200,
                        response: request.config.data,
                    })
                })

            const expectedActions = [{
                type: actions.CREATE_IDENTITY_REQUEST,
                integrationKey: {
                    name: 'test',
                },
            }, {
                type: actions.CREATE_IDENTITY_SUCCESS,
                integrationKey: {
                    name: 'test',
                    id: undefined,
                    json: undefined,
                    service: undefined,
                },
            }]

            await store.dispatch(actions.createIdentity({
                name: 'test',
            }))
            assert.deepStrictEqual(store.getActions().slice(0, 2), expectedActions)
        })
        it('creates CREATE_IDENTITY_FAILURE when MetaMask is not installed', async () => {
            sandbox.stub(web3Provider, 'default').callsFake(() => ({
                isEnabled: () => false,
            }))

            const expectedActions = [{
                type: actions.CREATE_IDENTITY_REQUEST,
                integrationKey: {
                    name: 'test',
                },
            },
            {
                type: actions.CREATE_IDENTITY_FAILURE,
                error: {
                    message: 'MetaMask browser extension is not installed',
                },
            }]

            await store.dispatch(actions.createIdentity({
                name: 'test',
            }))
            assert.deepStrictEqual(store.getActions().slice(0, 2), expectedActions)
        })
        it('creates CREATE_IDENTITY_FAILURE when HTTP request to create identity "api/v1/integration_keys" fails', async (done) => {
            const signSpy = sandbox.stub().callsFake((challenge, account) => Promise.resolve(`${challenge}SignedBy${account}`))
            const acc = 'testAccount'
            sandbox.stub(web3Provider, 'default').callsFake(() => ({
                isEnabled: () => true,
                getDefaultAccount: () => Promise.resolve(acc),
                eth: {
                    personal: {
                        sign: signSpy,
                    },
                },
            }))

            moxios.promiseWait()
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'post')
                    assert.equal(request.url, `${process.env.STREAMR_API_URL}/login/challenge/${acc}`)
                    request.respondWith({
                        status: 200,
                        response: {
                            id: '123',
                            challenge: 'challenge text',
                        },
                    })
                    return moxios.promiseWait()
                })
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'post')
                    assert.equal(request.url, `${process.env.STREAMR_API_URL}/integration_keys`)
                    assert(signSpy.calledOnce)
                    assert(signSpy.calledWith('challenge text'))
                    request.respondWith({
                        status: 500,
                        response: {
                            message: 'error',
                        },
                    })
                })

            const expectedActions = [{
                type: actions.CREATE_IDENTITY_REQUEST,
                integrationKey: {
                    name: 'test',
                },
            },
            {
                type: actions.CREATE_IDENTITY_FAILURE,
                error: {
                    message: 'error',
                    statusCode: 500,
                    code: null,
                },
            }]

            try {
                await store.dispatch(actions.createIdentity({
                    name: 'test',
                }))
            } catch (e) {
                debugger
                assert.deepStrictEqual(store.getActions().slice(0, 2), expectedActions)
                done()
            }
        })
    })

    describe('createIntegrationKey', () => {
        it('creates CREATE_INTEGRATION_KEY_SUCCESS when creating integration key has succeeded', async () => {
            const wait = moxios.promiseWait()
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'post')
                    request.respondWith({
                        status: 200,
                        response: request.config.data,
                    })
                })

            const expectedActions = [{
                type: actions.CREATE_INTEGRATION_KEY_REQUEST,
            }, {
                type: actions.CREATE_INTEGRATION_KEY_SUCCESS,
                integrationKey: {
                    name: 'test',
                    json: 'moi',
                },
            }]

            await store.dispatch(actions.createIntegrationKey({
                name: 'test',
                json: 'moi',
            }))
            assert.deepStrictEqual(store.getActions().slice(0, 2), expectedActions)
            await wait
        })

        it('creates CREATE_INTEGRATION_KEY_FAILURE when creating integration key has failed', async () => {
            const wait = moxios.promiseWait()
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'post')
                    request.respondWith({
                        status: 500,
                        response: {
                            message: 'test',
                            code: 'TEST',
                        },
                    })
                })

            const expectedActions = [{
                type: actions.CREATE_INTEGRATION_KEY_REQUEST,
            }, {
                type: actions.CREATE_INTEGRATION_KEY_FAILURE,
                error: {
                    message: 'test',
                    code: 'TEST',
                    statusCode: 500,
                },
            }]

            try {
                await store.dispatch(actions.createIntegrationKey({
                    name: 'test',
                    json: 'moi',
                }))
            } catch (e) {
                assert.deepStrictEqual(store.getActions().slice(0, 2), expectedActions)
            }
            await wait
        })
    })

    describe('deleteIntegrationKey', () => {
        it('creates DELETE_INTEGRATION_KEY_SUCCESS when deleting integration key has succeeded', async () => {
            const wait = moxios.promiseWait()
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'delete')
                    request.respondWith({
                        status: 200,
                    })
                })

            const expectedActions = [{
                type: actions.DELETE_INTEGRATION_KEY_REQUEST,
                id: 'test',
            }, {
                type: actions.DELETE_INTEGRATION_KEY_SUCCESS,
                id: 'test',
            }]

            await store.dispatch(actions.deleteIntegrationKey('test'))
            assert.deepStrictEqual(store.getActions(), expectedActions)
            await wait
        })

        it('creates DELETE_INTEGRATION_KEY_FAILURE when deleting integration key has failed', async () => {
            const wait = moxios.promiseWait()
                .then(() => {
                    const request = moxios.requests.mostRecent()
                    assert.equal(request.config.method, 'delete')
                    request.respondWith({
                        status: 500,
                        response: {
                            message: 'test',
                            code: 'TEST',
                        },
                    })
                })

            const expectedActions = [{
                type: actions.DELETE_INTEGRATION_KEY_REQUEST,
                id: 'test',
            }, {
                type: actions.DELETE_INTEGRATION_KEY_FAILURE,
                error: {
                    message: 'test',
                    code: 'TEST',
                    statusCode: 500,
                },
            }]

            try {
                await store.dispatch(actions.deleteIntegrationKey('test'))
            } catch (e) {
                assert.deepStrictEqual(store.getActions().slice(0, 2), expectedActions)
            }

            await wait
        })
    })
})
