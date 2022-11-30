import React, { FunctionComponent } from 'react'
import { Redirect, Route as RouterRoute, useParams } from 'react-router-dom'
import withErrorBoundary from '$shared/utils/withErrorBoundary'
import ErrorPage from '$shared/components/ErrorPage'
import ProjectPage from '$mp/containers/ProjectPage'
import StreamPreviewPage from '$mp/containers/StreamPreviewPage'
import ProjectsPage from '$mp/containers/Projects'
import ProjectConnectPage from '$mp/containers/ProjectPage/ProjectConnectPage'
import ProjectLiveDataPage from '$mp/containers/ProjectPage/ProjectLiveDataPage'
import NewProductPage from '$mp/components/NewProductPage'
import routes from '$routes'
const Route = withErrorBoundary(ErrorPage)(RouterRoute)

const ProjectDetailsPageRedirect: FunctionComponent = () => {
    const { id } = useParams<{id: string}>()
    return <Redirect to={routes.marketplace.product.overview({id})}/>
}

const MarketplaceRouter = () => [
    <Route exact path={routes.marketplace.index()} component={ProjectsPage} key="Projects" />,
    <Route exact path={routes.marketplace.streamPreview()} component={StreamPreviewPage} key="StreamPreview" />,
    <Route exact path={routes.marketplace.product.overview()} component={ProjectPage} key="ProjectDetailsOverviewPage" />,
    <Route exact path={routes.marketplace.product.connect()} component={ProjectConnectPage} key="ProjectDetailsConnectPage" />,
    <Route exact path={routes.marketplace.product.liveData()} component={ProjectLiveDataPage} key="ProjectDetailsLiveDataPage" />,
    <Route exact path={routes.products.new()} component={NewProductPage} key="NewProductPage" />,
    <Route exact path={routes.marketplace.product.index()} component={ProjectDetailsPageRedirect} key="ProjectDetailsPageRedirect"/>,
]

export default MarketplaceRouter
