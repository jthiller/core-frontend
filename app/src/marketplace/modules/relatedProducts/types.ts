import type { PayloadAction, ErrorInUi } from '$shared/types/common-types'
import type { ProductId, ProductIdList } from '../../types/product-types'
export type relatedProductIdAction = PayloadAction<{
    id: ProductIdList
}>
export type relatedProductIdActionCreator = (arg0: ProductId) => relatedProductIdAction
export type RelatedProductsAction = PayloadAction<{
    products: ProductIdList
}>
export type RelatedProductsActionCreator = (products: ProductIdList) => RelatedProductsAction
export type RelatedProductsErrorAction = PayloadAction<{
    error: ErrorInUi
}>
export type RelatedProductsErrorActionCreator = (error: ErrorInUi) => RelatedProductsErrorAction
