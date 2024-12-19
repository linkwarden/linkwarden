import React from 'react'
import { GetServerSideProps } from 'next'
import { prisma } from '@/lib/api/db'
import RSS from 'rss'

const RSSFeed: React.FC = () => null

export const getServerSideProps: GetServerSideProps = async ({ params, res, req }) => {
	const id = parseInt(params?.id as string, 10);
	if (isNaN(id)) {
		if (res) {
			res.statusCode = 404
			res.end()
		}
		return { props: {} }
	}

	const data = await prisma.collection.findUnique({
		where: {
			id: parseInt(params?.id as string),
			isPublic: true,
		},
		include: {
			links: true,
		}
	})

	if (!data) {
		res.statusCode = 404;
		res.end('Not Found');
		return { props: {} };
	}

	const host = req.headers.host;

	const protocol = req.headers['x-forwarded-proto'] || (req.socket ? 'https' : 'http');
	const siteUrl = `${protocol}://${host}/public/collections/${data.id}`;
	const feedUrl = `${protocol}://${host}/public/collections/${data.id}/rss`;

	const feed = new RSS({
		title: data.name,
		description: data.description,
		site_url: siteUrl,
		feed_url: feedUrl,
	})

	data.links.forEach((link) => {
		feed.item({
			title: link.name,
			description: link.description,
			url: link.url || '',
			date: link.createdAt,
		})
	})

	const xml = feed.xml({ indent: true });

	if (res) {
		res.setHeader('Content-Type', 'text/xml')
		res.write(xml)
		res.end()
	}

	return { props: {} }
}

export default RSSFeed