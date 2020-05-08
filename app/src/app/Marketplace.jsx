// @flow

import React from 'react'
import { Route as RouterRoute } from 'react-router-dom'

import withErrorBoundary from '$shared/utils/withErrorBoundary'
import routes from '$routes'

import ErrorPage from '$shared/components/ErrorPage'

import ProductPage from '$mp/containers/ProductPage'
import StreamPreviewPage from '$mp/containers/StreamPreviewPage'
import Products from '$mp/containers/Products'
import NewProductPage from '$mp/components/NewProductPage'

const Route = withErrorBoundary(ErrorPage)(RouterRoute)

const MarketplaceRouter = () => ([
    <Route exact path={routes.marketplace.root()} component={Products} key="Products" />,
    <Route exact path={routes.streamPreview()} component={StreamPreviewPage} key="StreamPreview" />,
    <Route exact path={routes.product()} component={ProductPage} key="ProductPage2" />,
    <Route exact path={routes.newProduct()} component={NewProductPage} key="NewProductPage" />,
])

export default MarketplaceRouter
