import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Button,
  ButtonGroup,
  Typography,
  Grid,
  Skeleton,
  CardActionArea,
  CardMedia,
  Card as MuiCard,
} from '@mui/material';
import AudioIcon from '@mui/icons-material/Audiotrack';

import Link from 'components/Link';
import Card from 'components/Card';
import useFetch from 'lib/hooks/useFetch';
import { useStoreSelector } from 'lib/redux/store';

type Aligns = 'inherit' | 'right' | 'left' | 'center' | 'justify';

export function bytesToRead(bytes: number) {
  if (isNaN(bytes)) return '0.0 B';
  if (bytes === Infinity) return '0.0 B';
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];
  let num = 0;

  while (bytes > 1024) {
    bytes /= 1024;
    ++num;
  }

  return `${bytes.toFixed(1)} ${units[num]}`;
}

const columns = [
  { id: 'file', label: 'Name', minWidth: 170, align: 'inherit' as Aligns },
  { id: 'mimetype', label: 'Type', minWidth: 100, align: 'inherit' as Aligns },
  {
    id: 'created_at',
    label: 'Date',
    minWidth: 170,
    align: 'right' as Aligns,
    format: (value) => new Date(value).toLocaleString(),
  },
];

function StatText({ children }) {
  return <Typography variant='h5' color='GrayText'>{children}</Typography>;
}

function StatTable({ rows, columns }) {
  return (
    <TableContainer sx={{ pt: 1 }}>
      <Table sx={{ minWidth: 100 }} size='small'>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.name} sx={{ borderColor: t => t.palette.divider }}>{col.name}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow
              hover
              key={row.username}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              {columns.map(col => (
                <TableCell key={col.id} sx={{ borderColor: t => t.palette.divider }}>
                  {col.format ? col.format(row[col.id]) : row[col.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Dashboard() {
  const user = useStoreSelector(state => state.user);

  const [images, setImages] = useState([]);
  const [recent, setRecent] = useState([]);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const updateImages = async () => {
    const imgs = await useFetch('/api/user/files');
    const recent = await useFetch('/api/user/recent?filter=media');
    const stts = await useFetch('/api/stats');
    setImages(imgs);
    setStats(stts);
    setRecent(recent);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleDelete = async image => {
    const res = await useFetch('/api/user/files', 'DELETE', { id: image.id });
    if (!res.error) updateImages();
  };

  useEffect(() => {
    updateImages();
  }, []);
  
  return (
    <>
      <Typography variant='h4'>Welcome back {user?.username}</Typography>
      <Typography color='GrayText' pb={2}>You have <b>{images.length ? images.length : '...'}</b> images</Typography>
      
      <Typography variant='h4'>Recent Images</Typography>
      <Grid container spacing={4} py={2}>
        {recent.length ? recent.map(image => (
          <Grid item xs={12} sm={3} key={image.id}>
            <MuiCard sx={{ minWidth: '100%' }}>
              <CardActionArea>
                <CardMedia
                  sx={{ height: 220 }}
                  image={image.url}
                  title={image.file}
                  controls
                  component={image.mimetype.split('/')[0] === 'audio' ? AudioIcon : image.mimetype.split('/')[0]} // this is done because audio without controls is hidden
                />
              </CardActionArea>
            </MuiCard>
          </Grid>
        )) : [1,2,3,4].map(x => (
          <Grid item xs={12} sm={3} key={x}>
            <Skeleton variant='rectangular' width='100%' height={220} sx={{ borderRadius: 1 }}/>
          </Grid>
        ))}
      </Grid>
      <Typography variant='h4'>Stats</Typography>
      <Grid container spacing={4} py={2}>
        <Grid item xs={12} sm={4}>
          <Card name='Size' sx={{ height: '100%' }}>
            <StatText>{stats ? stats.size : <Skeleton variant='text' />}</StatText>
            <Typography variant='h3'>Average Size</Typography>
            <StatText>{stats ? bytesToRead(stats.size_num / stats.count) : <Skeleton variant='text' />}</StatText>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card name='Images' sx={{ height: '100%' }}>
            <StatText>{stats ? stats.count : <Skeleton variant='text' />}</StatText>
            <Typography variant='h3'>Views</Typography>
            <StatText>{stats ? `${stats.views_count} (${isNaN(stats.views_count / stats.count) ? '0' : stats.views_count / stats.count})` : <Skeleton variant='text' />}</StatText>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card name='Users' sx={{ height: '100%' }}>
            <StatText>{stats ? stats.count_users : <Skeleton variant='text' />}</StatText>
          </Card>
        </Grid>
      </Grid>
      <Card name='Images' sx={{ my: 2 }} elevation={0} variant='outlined'>
        <Link href='/dashboard/images' pb={2}>View Gallery</Link>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                {columns.map(column => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    sx={{ minWidth: column.minWidth, borderColor: t => t.palette.divider }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell sx={{ minWidth: 200, borderColor: t => t.palette.divider }} align='right'>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {images
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(row => {
                  return (
                    <TableRow hover role='checkbox' tabIndex={-1} key={row.id}>
                      {columns.map(column => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align} sx={{ borderColor: t => t.palette.divider }}>
                            {column.format ? column.format(value) : value}
                          </TableCell>
                        );
                      })}
                      <TableCell align='right'  sx={{ borderColor: t => t.palette.divider }}>
                        <ButtonGroup variant='outlined'>
                          <Button onClick={() => handleDelete(row)} color='error' size='small'>Delete</Button>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component='div'
          count={images.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage} />
      </Card>
      <Card name='Images per User' sx={{ height: '100%', my: 2 }} elevation={0} variant='outlined'>
        <StatTable
          columns={[
            { id: 'username', name: 'Name' },
            { id: 'count', name: 'Images' },
          ]}
          rows={stats ? stats.count_by_user : []} />
      </Card>
      <Card name='Types' sx={{ height: '100%', my: 2 }} elevation={0} variant='outlined'>
        <StatTable
          columns={[
            { id: 'mimetype', name: 'Type' },
            { id: 'count', name: 'Count' },
          ]}
          rows={stats ? stats.types_count : []} />
      </Card>
    </>
  );
}