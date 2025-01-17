import React, { FunctionComponent } from 'react'
import Sidebar from '$shared/components/Sidebar'
import PermissionsProvider from '$shared/components/PermissionsProvider'
import SidebarContent from './Sidebar'
const ShareSidebar: FunctionComponent<{
    sidebarName: string
    resourceTitle: string
    onClose: () => void
    resourceType: string
    resourceId: string
}> = ({
    sidebarName, resourceTitle, onClose, resourceType, resourceId, ...props
}) => (
    <React.Fragment>
        <Sidebar.Header title="Share settings" onClose={onClose} subtitle={resourceTitle} />
        <Sidebar.Body>
            <PermissionsProvider resourceId={resourceId} resourceType={resourceType}>
                <SidebarContent
                    {...props}
                    allowEmbed
                    onClose={onClose}
                    resourceId={resourceId}
                    resourceTitle={resourceTitle}
                    resourceType={resourceType}
                />
            </PermissionsProvider>
        </Sidebar.Body>
    </React.Fragment>
)

export default ShareSidebar
