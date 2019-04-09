import api from '$editor/shared/utils/api'

const getModulesURL = `${process.env.STREAMR_API_URL}/modules`

export const getData = ({ data }) => data

export const LOAD_JSON_REQ = {
    type: 'json',
}

export async function send({
    apiKey,
    data = {},
    dashboardId,
    canvasId,
    moduleHash,
}) {
    const dashboardPath = dashboardId ? `/dashboards/${dashboardId}` : ''
    const modulePath = `/canvases/${canvasId}/modules/${moduleHash}`
    const url = `${process.env.STREAMR_API_URL}${dashboardPath}${modulePath}/request`
    return api().post(url, {
        ...LOAD_JSON_REQ,
        ...data,
    }, {
        Authorization: `Token ${apiKey}`,
    }).then(getData)
}

export async function getModules() {
    return api().get(getModulesURL).then(getData)
}

export async function getModule({ id, configuration } = {}) {
    return api().post(`${getModulesURL}/${id}`, configuration).then(getData)
}
