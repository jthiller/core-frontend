import * as State from '../state'
import { productStates } from '$shared/utils/constants'

describe('Product State', () => {
    describe('isPublished', () => {
        it('detects published state', () => {
            expect(State.isPublished({
                state: productStates.DEPLOYED,
            })).toBe(true)
            expect(State.isPublished({
                state: productStates.DEPLOYING,
            })).toBe(true)
            expect(State.isPublished({
                state: productStates.NOT_DEPLOYED,
            })).toBe(false)
            expect(State.isPublished({
                state: productStates.UNDEPLOYING,
            })).toBe(false)
        })

        it('detects published state for empty product', () => {
            expect(State.isPublished({})).toBe(false)
            expect(State.isPublished(undefined)).toBe(false)
        })
    })

    describe('update', () => {
        it('updates unpublished product', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.NOT_DEPLOYED,
            }
            expect(State.update(product, (p) => ({
                ...p,
                name: 'newName',
                description: 'A better description',
            }))).toMatchObject({
                id: '1',
                name: 'newName',
                description: 'A better description',
                state: productStates.NOT_DEPLOYED,
            })
        })

        it('puts updates as pending changes for published product', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.DEPLOYED,
            }
            expect(State.update(product, (p) => ({
                ...p,
                name: 'Better Name',
                description: 'A better description',
            }))).toMatchObject({
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.DEPLOYED,
                pendingChanges: {
                    name: 'Better Name',
                    description: 'A better description',
                },
            })
        })

        it('puts updates as pending changes for product that is deploying', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.DEPLOYING,
            }
            expect(State.update(product, (p) => ({
                ...p,
                name: 'Better Name',
                description: 'A better description',
            }))).toMatchObject({
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.DEPLOYING,
                pendingChanges: {
                    name: 'Better Name',
                    description: 'A better description',
                },
            })
        })
    })

    describe('getPendingChanges', () => {
        it('returns empty object for unpublished product', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.NOT_DEPLOYED,
            }
            expect(State.getPendingChanges(product)).toMatchObject({})
        })

        it('returns pending changes for published product', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.DEPLOYED,
            }
            expect(State.getPendingChanges(State.update(product, (p) => ({
                ...p,
                name: 'Better Name',
                description: 'A better description',
            })))).toMatchObject({
                name: 'Better Name',
                description: 'A better description',
            })
        })
    })

    describe('hasPendingChange', () => {
        it('it returns false for unpublished product change', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.NOT_DEPLOYED,
            }
            const nextProduct = State.update(product, (p) => ({
                ...p,
                name: 'Better Name',
                description: 'A better description',
            }))
            expect(State.hasPendingChange(nextProduct, 'name')).toBe(false)
            expect(State.hasPendingChange(nextProduct, 'description')).toBe(false)
        })

        it('it returns true for published product change', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.DEPLOYED,
            }
            const nextProduct = State.update(product, (p) => ({
                ...p,
                name: 'Better Name',
                description: 'A better description',
            }))
            expect(State.hasPendingChange(nextProduct, 'name')).toBe(true)
            expect(State.hasPendingChange(nextProduct, 'description')).toBe(true)
        })
    })

    describe('withPendingChanges', () => {
        it('it returns the current data for unpublished product', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.NOT_DEPLOYED,
            }
            expect(State.withPendingChanges(State.update(product, (p) => ({
                ...p,
                name: 'Better Name',
                description: 'A better description',
            })))).toMatchObject({
                id: '1',
                name: 'Better Name',
                description: 'A better description',
                state: productStates.NOT_DEPLOYED,
            })
        })

        it('it returns the current data for published product', () => {
            const product = {
                id: '1',
                name: 'My Product',
                description: 'My nice product',
                state: productStates.DEPLOYED,
            }
            expect(State.withPendingChanges(State.update(product, (p) => ({
                ...p,
                name: 'Better Name',
                description: 'A better description',
            })))).toMatchObject({
                id: '1',
                name: 'Better Name',
                description: 'A better description',
                state: productStates.DEPLOYED,
            })
        })
    })
})
