'use client';

import { Fragment, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight, ImageIcon, Link2, Settings2 } from 'lucide-react';
import { BannerActions } from '@/components/content/banner-actions';

interface AdminBanner {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string;
  link: string | null;
  linkText: string;
  linkTarget: string;
  type: string;
  position: number | null;
  badge: string | null;
  badgeColor: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface BannersTableProps {
  banners: AdminBanner[];
}

export function BannersTable({ banners }: BannersTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="hidden sm:table-cell">Position</TableHead>
            <TableHead className="hidden md:table-cell">Schedule</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => {
            const isExpanded = expandedRows.has(banner.id);
            return (
              <Fragment key={banner.id}>
                <TableRow className="group">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleRow(banner.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{banner.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{banner.position}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {banner.startsAt || banner.endsAt ? (
                      <div className="text-xs">
                        {banner.startsAt && (
                          <p>Start: {new Date(banner.startsAt).toLocaleDateString()}</p>
                        )}
                        {banner.endsAt && (
                          <p>End: {new Date(banner.endsAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    ) : (
                      'Always'
                    )}
                  </TableCell>
                  <TableCell>
                    <BannerActions banner={banner} />
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={6} className="p-0">
                      <div className="space-y-4 p-4">
                        {/* Row 1: Link Settings */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Link2 className="h-4 w-4" />
                            Link Settings
                          </div>
                          <div className="grid gap-4 text-sm sm:grid-cols-3">
                            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                              <span className="text-muted-foreground">URL</span>
                              <span className="max-w-[200px] truncate font-mono text-xs">
                                {banner.link || '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                              <span className="text-muted-foreground">Text</span>
                              <span>{banner.linkText}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                              <span className="text-muted-foreground">Target</span>
                              <Badge variant="secondary" className="text-xs">
                                {banner.linkTarget}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Display Settings */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Settings2 className="h-4 w-4" />
                            Display Settings
                          </div>
                          <div className="grid gap-4 text-sm sm:grid-cols-3">
                            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                              <span className="text-muted-foreground">Type</span>
                              <Badge variant="outline">{banner.type}</Badge>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                              <span className="text-muted-foreground">Position</span>
                              <span>{banner.position ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                              <span className="text-muted-foreground">Badge Text</span>
                              {banner.badge ? (
                                <Badge
                                  style={{
                                    backgroundColor: banner.badgeColor || undefined,
                                  }}
                                >
                                  {banner.badge}
                                </Badge>
                              ) : (
                                <span>—</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Thumbnail */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            Thumbnail
                          </div>
                          {banner.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={banner.thumbnail}
                              alt={banner.title}
                              className="h-32 max-w-md rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-32 max-w-md items-center justify-center rounded-md bg-muted">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
