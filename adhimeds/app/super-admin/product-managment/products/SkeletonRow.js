import { memo } from 'react';

export const SkeletonRow = memo(() => (
  <tr className="skeleton-row">
    <td className="skeleton-cell checkbox-skeleton-cell">
      <div className="skeleton skeleton-checkbox"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-thumb"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-text"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-text"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-text"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-text"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-text"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-toggle"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-toggle"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-toggle"></div>
    </td>
    <td className="skeleton-cell">
      <div className="skeleton skeleton-icon"></div>
    </td>
  </tr>
));

SkeletonRow.displayName = 'SkeletonRow';