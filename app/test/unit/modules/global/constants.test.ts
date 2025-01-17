import * as constants from '$mp/modules/global/constants'
describe('global - constants', () => {
    it('is namespaced correctly', () => {
        Object.keys(constants).forEach((key) => {
            if (key === '__esModule') {
                return // ignore __esModule: true
            }

            expect((constants as {[key: string]: string})[key]).toEqual(expect.stringMatching(/^marketplace\/global\//))
        })
    })
})
