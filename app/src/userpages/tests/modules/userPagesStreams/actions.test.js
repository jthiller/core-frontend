import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import moxios from 'moxios'

import * as actions from '$userpages/modules/userPageStreams/actions'
import * as entitiesActions from '$shared/modules/entities/actions'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('Stream actions', () => {
    let store
    let oldStreamrApiUrl

    beforeEach(() => {
        oldStreamrApiUrl = process.env.STREAMR_API_URL
        process.env.STREAMR_API_URL = ''
        moxios.install()
        store = mockStore({
            ids: [],
            openStream: {
                id: null,
            },
            error: null,
        })
    })

    afterEach(() => {
        moxios.uninstall()
        jest.clearAllMocks()
        jest.restoreAllMocks()
        store.clearActions()
        process.env.STREAMR_API_URL = oldStreamrApiUrl
    })

    describe('getStream', () => {
        it('creates GET_STREAM_SUCCESS when fetching a stream has succeeded', async () => {
            const id = 'asdfasdfasasd'
            moxios.stubRequest(`${process.env.STREAMR_API_URL}/streams/${id}`, {
                status: 200,
                response: {
                    id: 'test',
                    name: 'test',
                },
            })
            jest.spyOn(entitiesActions, 'updateEntities').mockImplementation(() => ({
                type: 'updateEntities',
            }))

            const expectedActions = [{
                type: actions.GET_STREAM_REQUEST,
            }, {
                type: 'updateEntities',
            }, {
                type: actions.GET_STREAM_SUCCESS,
                stream: 'test',
            }]
            await store.dispatch(actions.getStream(id))
            expect(store.getActions()).toEqual(expectedActions)
        })
        it('creates GET_STREAM_FAILURE when fetching stream has failed', async () => {
            const id = 'asdfasdfasasd'
            moxios.stubRequest(`${process.env.STREAMR_API_URL}/streams/${id}`, {
                status: 500,
                response: {
                    error: 'test',
                    code: 'TEST',
                },
            })

            const expectedActions = [{
                type: actions.GET_STREAM_REQUEST,
            }, {
                type: actions.GET_STREAM_FAILURE,
                error: {
                    message: 'test',
                    code: 'TEST',
                    statusCode: 500,
                },
            }]

            try {
                await store.dispatch(actions.getStream(id))
            } catch (e) {
                expect(store.getActions().slice(0, 2)).toMatchObject(expectedActions)
            }
        })
    })

    describe('updateStream', () => {
        it('creates UPDATE_STREAM_SUCCESS and CREATE_NOTIFICATION when updating a stream has succeeded', async () => {
            const id = 'test'
            const stream = {
                id,
                name: 'test',
            }
            moxios.stubRequest(`${process.env.STREAMR_API_URL}/streams/${id}`, {
                status: 200,
                response: stream,
            })
            jest.spyOn(entitiesActions, 'updateEntities').mockImplementation(() => ({
                type: 'updateEntities',
            }))

            const expectedActions = [{
                type: actions.UPDATE_STREAM_REQUEST,
            }, {
                type: 'updateEntities',
            }, {
                type: actions.UPDATE_STREAM_SUCCESS,
                stream,
            }]

            await store.dispatch(actions.updateStream(stream))
            expect(store.getActions().slice(0, 2)).toEqual(expectedActions.slice(0, 2))
        })
        it('creates UPDATE_STREAM_FAILURE and CREATE_NOTIFICATION when updating a stream has failed', async () => {
            const id = 'test'
            const db = {
                id,
                name: 'test',
            }
            moxios.stubRequest(`${process.env.STREAMR_API_URL}/streams/${id}`, {
                status: 500,
                response: {
                    error: 'test',
                    code: 'TEST',
                },
            })

            const expectedActions = [{
                type: actions.UPDATE_STREAM_REQUEST,
            }, {
                type: actions.UPDATE_STREAM_FAILURE,
                error: {
                    message: 'test',
                    code: 'TEST',
                    statusCode: 500,
                },
            }]

            try {
                await store.dispatch(actions.updateStream(db))
            } catch (e) {
                expect(store.getActions().slice(0, 2)).toMatchObject(expectedActions.slice(0, 2))
            }
        })
        it('uses PUT request', async () => {
            const id = 'test'

            store.dispatch(actions.updateStream({
                id,
            }))
            await moxios.promiseWait()
            const request = moxios.requests.mostRecent()
            expect(request.url).toEqual(`${process.env.STREAMR_API_URL}/streams/${id}`)
            expect(request.config.method.toLowerCase()).toEqual('put')
        })
    })

    describe('deleteStream', () => {
        const streamId = 'asdfjasldfjasödf'
        const encodedStreamId = 'asdfjasldfjas%C3%B6df'

        it('uses DELETE request', async () => {
            const stream = {
                id: streamId,
            }
            store.dispatch(actions.deleteStream(stream.id))
            await moxios.promiseWait()
            const request = moxios.requests.mostRecent()
            expect(request.url).toEqual(`${process.env.STREAMR_API_URL}/streams/${encodedStreamId}`)
            expect(request.config.method.toLowerCase()).toEqual('delete')
        })
        it('creates DELETE_STREAM_SUCCESS when deleting stream has succeeded', async () => {
            const stream = {
                id: streamId,
            }
            moxios.stubRequest(`${process.env.STREAMR_API_URL}/streams/${encodedStreamId}`, {
                status: 200,
            })

            const expectedActions = [{
                type: actions.DELETE_STREAM_REQUEST,
            }, {
                type: actions.DELETE_STREAM_SUCCESS,
                id: stream.id,
            }]

            await store.dispatch(actions.deleteStream(stream.id))
            expect(store.getActions().slice(0, 2)).toEqual(expectedActions.slice(0, 2))
        })
        it('creates DELETE_STREAM_FAILURE when deleting stream has failed', async () => {
            const stream = {
                id: streamId,
            }
            moxios.stubRequest(`${process.env.STREAMR_API_URL}/streams/${encodedStreamId}`, {
                status: 500,
                response: {
                    error: 'test',
                    code: 'TEST',
                },
            })

            const expectedActions = [{
                type: actions.DELETE_STREAM_REQUEST,
            }, {
                type: actions.DELETE_STREAM_FAILURE,
                error: {
                    message: 'test',
                    code: 'TEST',
                    statusCode: 500,
                },
            }]
            try {
                await store.dispatch(actions.deleteStream(stream.id))
                expect(false).toBe(true) // fail on purpose because action did not throw
            } catch (e) {
                expect(store.getActions().slice(0, 2)).toMatchObject(expectedActions.slice(0, 2))
            }
        })
    })

    it('must dispatch OPEN_STREAM when opening stream', () => {
        const id = 'askdfjasldkfjasdlkf'
        expect(actions.openStream(id)).toEqual({
            type: actions.OPEN_STREAM,
            id,
        })
    })
})
