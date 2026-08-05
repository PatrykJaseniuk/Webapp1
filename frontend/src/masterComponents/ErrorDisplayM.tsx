import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import type { NavLink } from '@/generic';

type NavLinkTo = Readonly<{
  readonly login: NavLink;
}>;

type ErrorDisplaySProps = {
  readonly is404: boolean;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<ErrorDisplaySProps>;
  readonly is404: boolean;
};

export const ErrorDisplayM = ({ Slave, is404 }: Props): JSX.Element => {
  const navLinkTo: NavLinkTo = {
    login: ({ content, style }) => <Link to="/login" style={style}>{content}</Link>,
  };

  return <Slave is404={is404} navLinkTo={navLinkTo} />;
};