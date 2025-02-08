import { ComponentType, JSX } from "react";

export interface IRoute {
    path: string;
    name: string;
    layout?: string;
    exact?: boolean;
    component?: ComponentType;
    disabled?: boolean;
    icon?: JSX.Element;
    secondary?: boolean;
    collapse?: boolean;
    items?: IRoute[];
    rightElement?: boolean;
    invisible?: boolean;
}