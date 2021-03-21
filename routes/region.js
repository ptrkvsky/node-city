require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});

const router = require('express').Router();
const slugify = require('slugify')
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: process.env.SANITY_PROJECTID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_TOKEN, // we need this to get write access
  useCdn: false // We can't use the CDN for writing
})

router.post('/upload', async (req, res) => {
	try {
		if(!req.body) {
			res.send({
					status: false,
					message: 'No file uploaded'
			});
		} else {
			const regions = req.body
			let transaction = client.transaction()
			regions.map((region) => {
				const slug = slugify(region.name ,{
					replacement: '-',  // Replace spaces with replacement character, defaults to `-`
					remove: undefined, // Remove characters that match regex, defaults to `undefined`
					lower: true,       // Convert to lower case, defaults to `false`
					strict: false,     // Strip special characters except replacement, defaults to `false`
					locale: 'fr'       // Language code of the locale to use
				})

				const sanityRegion = {
					_id: region.code,
					_type: 'region',
					code: region.code,
					name: region.name,
					slug: {
						"_type":"slug",
						"current": slug
					},
				}
				transaction.createOrReplace(sanityRegion)
			})
			transaction.commit()
			res.status(200).json(req.body);
		}
	} catch (err) {
		console.error(err)
		res.status(500).send(err);
	}
});

module.exports = router;