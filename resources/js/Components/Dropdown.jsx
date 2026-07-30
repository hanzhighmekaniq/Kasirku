import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

const DropDownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen } = useContext(DropDownContext);

    return (
        <>
            <div onClick={toggleOpen}>{children}</div>

            {open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                ></div>
            )}
        </>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    dropUp = false,
    radiusClasses = 'rounded-md',
    contentClasses = 'py-1 bg-popover text-popover-foreground',
    children,
}) => {
    const { open, setOpen } = useContext(DropDownContext);
    const panelRef = useRef(null);

    /* Auto-flip: kalau panel keluar dari viewport di sisi yang dipilih,
     * arahnya dibalik supaya tidak tembus tepi layar. */
    const [effectiveAlign, setEffectiveAlign] = useState(align);

    useEffect(() => {
        if (!open) setEffectiveAlign(align);
    }, [open, align]);

    useLayoutEffect(() => {
        if (!open || !panelRef.current) return;

        const reposition = () => {
            const el = panelRef.current;
            if (!el) return;

            // Ukur pakai alignment asli supaya keputusan tidak berayun-ayun.
            const parent = el.parentElement;
            if (!parent) return;

            const anchor = parent.getBoundingClientRect();
            const panelWidth = el.offsetWidth;
            const margin = 8;
            const viewport = document.documentElement.clientWidth;

            const overflowRight = anchor.left + panelWidth > viewport - margin;
            const overflowLeft = anchor.right - panelWidth < margin;

            if (align === 'left' && overflowRight && !overflowLeft) {
                setEffectiveAlign('right');
            } else if (align === 'right' && overflowLeft && !overflowRight) {
                setEffectiveAlign('left');
            } else {
                setEffectiveAlign(align);
            }
        };

        reposition();

        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);

        return () => {
            window.removeEventListener('resize', reposition);
            window.removeEventListener('scroll', reposition, true);
        };
    }, [open, align, width]);

    let alignmentClasses = dropUp ? 'origin-bottom' : 'origin-top';

    if (effectiveAlign === 'left') {
        alignmentClasses = dropUp
            ? 'ltr:origin-bottom-left rtl:origin-bottom-right start-0'
            : 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (effectiveAlign === 'right') {
        alignmentClasses = dropUp
            ? 'ltr:origin-bottom-right rtl:origin-bottom-left end-0'
            : 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    const verticalClasses = dropUp ? 'bottom-full mb-2' : 'mt-2';

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    } else if (width === '56') {
        widthClasses = 'w-56';
    } else if (width === '64') {
        widthClasses = 'w-64';
    } else if (width === '72') {
        widthClasses = 'w-72';
    } else if (width === 'full') {
        widthClasses = 'w-full';
    }

    return (
        <>
            <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div
                    ref={panelRef}
                    className={`absolute z-50 max-w-[calc(100vw-1rem)] shadow-lg ${radiusClasses} ${verticalClasses} ${alignmentClasses} ${widthClasses}`}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className={
                            `border border-border ${radiusClasses} ` +
                            contentClasses
                        }
                    >
                        {children}
                    </div>
                </div>
            </Transition>
        </>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-popover-foreground transition duration-150 ease-in-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
