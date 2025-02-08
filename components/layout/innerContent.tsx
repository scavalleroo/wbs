import React from 'react';

interface InnerContentProps {
  children: React.ReactNode;
  extra?: string;
  [key: string]: any;
}

export default function InnerContent(props: InnerContentProps) {
  const { children, extra, ...rest } = props;
  return (
    <div
      className={`itemx-center mx-auto flex flex-col xl:max-w-[1170px] ${extra}`}
      {...rest}
    >
      {children}
    </div>
  );
}
