import React from 'react'
import { Route as RouterRoute, Redirect } from 'react-router-dom'
import { userIsAuthenticated } from '$auth/utils/userAuthenticated'
import withErrorBoundary from '$shared/utils/withErrorBoundary'
import ErrorPage from '$shared/components/ErrorPage'
// Userpages
import StreamInspectorPage from '$app/src/pages/StreamInspectorPage'
import StreamCreatePage from '$app/src/pages/StreamCreatePage'
import StreamListView from '$app/src/pages/StreamListPage'
import StreamEditPage from '$app/src/pages/StreamEditPage'
import TransactionList from '$userpages/components/TransactionPage/List'
import ProfilePage from '$userpages/components/ProfilePage'
import PurchasesPage from '$userpages/components/PurchasesPage'
import ProductsPage from '$userpages/components/ProductsPage'
import DataUnionPage from '$userpages/components/DataUnionPage'
import EditProductPage from '$mp/containers/EditProductPage'
import routes from '$routes'
const Route = withErrorBoundary(ErrorPage)(RouterRoute)
// Userpages Auth
const ProfilePageAuth = userIsAuthenticated(ProfilePage)
const StreamListViewAuth = userIsAuthenticated(StreamListView)
const TransactionListAuth = userIsAuthenticated(TransactionList)
const PurchasesPageAuth = userIsAuthenticated(PurchasesPage)
const ProductsPageAuth = userIsAuthenticated(ProductsPage)
const DataUnionPageAuth = userIsAuthenticated(DataUnionPage)
const EditProductAuth = userIsAuthenticated(EditProductPage)
const StreamCreatePageAuth = userIsAuthenticated(StreamCreatePage)

const UserpagesRouter = () => [
    <Route exact path={routes.profile()} component={ProfilePageAuth} key="ProfilePage" />,
    <Route exact path={routes.streams.new()} component={StreamCreatePageAuth} key="StreamCreatePage" />,
    <Route exact path={routes.streams.show()} component={StreamEditPage} key="streamEditPage" />,
    <Redirect exact from={routes.streams.public.show()} to={routes.streams.show()} key="publicStreamPageRedir" />,
    <Redirect
        exact
        from={routes.streams.public.preview()}
        to={routes.streams.preview()}
        key="publicStreamPreviewPageRedir"
    />,
    <Route exact path={routes.streams.preview()} component={StreamInspectorPage} key="streamPreviewPage" />,
    // <Route exact path={routes.streams.index()} component={StreamListViewAuth} key="StreamListView" />,
    <Route exact path={routes.transactions()} component={TransactionListAuth} key="TransactionList" />,
    <Route exact path={routes.subscriptions()} component={PurchasesPageAuth} key="PurchasesPage" />,
    <Route exact path={routes.products.index()} component={ProductsPageAuth} key="ProductsPage" />,
    <Route exact path={routes.dataunions.index()} component={DataUnionPageAuth} key="DataUnionPage" />,
    <Route exact path={routes.products.edit()} component={EditProductAuth} key="EditProduct" />,
    <Redirect from={routes.root()} to={routes.streams.index()} key="RootRedirect" />, // edge case for localhost
    <Redirect from={routes.core()} to={routes.streams.index()} key="StreamListViewRedirect" />,
]

export default UserpagesRouter
