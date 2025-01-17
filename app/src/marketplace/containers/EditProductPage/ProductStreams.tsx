import React, { useContext, useMemo } from 'react'
import cx from 'classnames'
import { Link } from 'react-router-dom'
import uniqBy from 'lodash/uniqBy'
import docsLinks from '$shared/../docsLinks'
import StreamSelectorComponent from '$mp/components/StreamSelector'
import useEditableState from '$shared/contexts/Undo/useEditableState'
import { usePending } from '$shared/hooks/usePending'
import useValidation from '../ProductController/useValidation'
import useEditableProductActions from '../ProductController/useEditableProductActions'
import { useController } from '../ProductController'
import { Context as EditControllerContext } from './EditControllerProvider'
import styles from './productStreams.pcss'
type Props = {
    disabled?: boolean
}

const ProductStreams = ({ disabled }: Props) => {
    const { state: product } = useEditableState()
    const { isValid, message } = useValidation('streams')
    const { updateStreams } = useEditableProductActions()
    const { publishAttempted } = useContext(EditControllerContext)
    const { allStreams } = useController()
    const { isPending: fetchingAllStreams } = usePending('product.LOAD_ALL_STREAMS')
    // Filter product streams based on actual selection
    const streamIds = product.streams
    const availableStreams = useMemo(() => uniqBy(allStreams, 'id'), [allStreams])
    return (
        <section id="streams" className={cx(styles.root, styles.StreamSelector)}>
            <div>
                <h1>Add streams</h1>
                <p>
                    Products can contain a range of streams, or a single &quot;firehose&quot; type stream, it&apos;s up
                    to you. If you haven&apos;t made any streams yet, you can create one here. For help creating
                    streams, see the <Link to={docsLinks.creatingDataProducts}>docs</Link>.
                </p>
                <StreamSelectorComponent
                    availableStreams={availableStreams}
                    fetchingStreams={fetchingAllStreams}
                    onEdit={updateStreams}
                    streams={streamIds}
                    className={styles.streams}
                    error={publishAttempted && !isValid ? message : undefined}
                    disabled={!!disabled}
                />
            </div>
        </section>
    )
}

export default ProductStreams
