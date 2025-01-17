import React, { FunctionComponent, ReactElement, ReactNode } from 'react'
import styled, { css } from 'styled-components'
import ReactSelect, { components } from 'react-select'
import cx from 'classnames'
import SvgIcon, { SvgIconProps } from '$shared/components/SvgIcon'
export type Option = {
    value: any
    label: string
    icon?: ReactElement
}
export type Props = {
    placeholder?: string
    options: Array<Option>
    value: any
    name?: string
    onChange?: (...args: Array<any>) => any
    required?: boolean
    clearable?: boolean
    disabled?: boolean
    controlClassName?: string
}
// TODO add typing
const customStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        padding: '0',
        '&:hover': {
            path: {
                stroke: '#A3A3A3',
            },
        },
        backgroundColor: state.isDisabled ? '#EFEFEF' : provided.backgroundColor,
        opacity: state.isDisabled ? 0.5 : 1,
        backfaceVisibility: 'hidden',
        color: state.isDisabled ? '#32323280' : '#323232',
        border: state.isFocused ? '1px solid #0324FF' : '1px solid #EFEFEF',
        borderRadius: '4px',
        height: '40px',
        boxShadow: 'none',
        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        pointerEvents: 'auto',
        fontSize: '1rem',
        letterSpacing: '0',
        lineHeight: '2rem',
        width: '100%',
    }),
    dropdownIndicator: (provided: any, state: any) => ({
        ...provided,
        color: state.isDisabled ? '#32323280' : '#323232',
        marginRight: '8px',
    }),
    indicatorSeparator: () => ({}),
    menu: (provided: any) => ({
        ...provided,
        marginTop: '0.5rem',
        padding: '0',
        zIndex: '10',
    }),
    menuList: (provided: any) => ({ ...provided, margin: '0.2rem 0', padding: '0' }),
    option: (provided: any, state: any) => ({
        ...provided,
        display: 'flex',
        textAlign: 'left',
        padding: '0 1rem',
        paddingLeft: '1rem',
        color: '#323232',
        position: 'relative',
        backgroundColor: state.isSelected || state.isFocused ? '#f8f8f8' : null,
        '&:active': {
            backgroundColor: '#f8f8f8',
        },
        lineHeight: '2rem',
        alignItems: 'center',
    }),
    placeholder: () => ({
        color: '#CDCDCD',
        lineHeight: '1rem',
    }),
    valueContainer: (provided: any) => ({
        ...provided,
        padding: '0 1rem',
        color: '#323232',
        lineHeight: '1rem',
        overflow: 'visible',
    }),
    singleValue: (provided: any) => ({
        ...provided,
        margin: 0,
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
    }),
}

const Control: FunctionComponent<{className?: string, children?: ReactNode | ReactNode[], selectProps: any}> = ({ className, children, ...props }) => {
    const { controlClassName } = props.selectProps
    return (
        <components.Control {...props} className={cx(className, controlClassName)}>
            {children}
        </components.Control>
    )
}

const UnstyledTick = (props: any) => <SvgIcon {...props} name="tick" />

const Tick = styled(UnstyledTick)`
    height: 8px;
    right: 12px;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
`
const OptionIconWrapper = styled.div`
    width: 20px;
    margin-right: 0.5rem;
`

const IconOption: FunctionComponent<{isSelected: boolean, data: {icon: ReactNode, label: string}}> = (props) => (
    <components.Option {...props}>
        {props.isSelected && <Tick />}
        {props.data.icon != null && <OptionIconWrapper>{props.data.icon}</OptionIconWrapper>}
        {props.data.label}
    </components.Option>
)

type CaretProps = {
    $isOpen: boolean, // transient prop -> does not forward to SvgIcon
} & SvgIconProps

const Caret = styled(SvgIcon)<CaretProps>`
    height: 8px;
    width: 10px;
    transition: transform 180ms ease-in-out;
    transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : ''};
`

const DropdownIndicator = (props: any) =>
    components.DropdownIndicator && (
        <components.DropdownIndicator {...props}>
            <Caret
                name="caretDown"
                $isOpen={props.selectProps.menuIsOpen}
            />
        </components.DropdownIndicator>
    )

const IconWrapper = styled.div`
    width: 24px;
    margin-right: 0.5rem;
`

const SingleValue = ({ children, ...props }) => {
    const { icon } = props.getValue()[0] || {}
    return (
        <components.SingleValue {...props}>
            {icon != null && <IconWrapper>{icon}</IconWrapper>}
            {children}
        </components.SingleValue>
    )
}

const UnstyledSelect = ({ controlClassName, required = false, clearable = true, disabled, ...props }: Props) => (
    <ReactSelect
        styles={customStyles}
        components={{
            Control,
            IndicatorSeparator: null,
            Option: IconOption,
            DropdownIndicator,
            SingleValue,
        }}
        controlClassName={controlClassName}
        required={required}
        clearable={clearable}
        isDisabled={disabled}
        isSearchable={false} // $FlowFixMe potential override necessary.
        {...props}
    />
)

const Select = styled(UnstyledSelect)`
    font-size: 0.875rem;
`
export default Select
