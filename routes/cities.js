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

// Upload cities
router.post('/upload', async (req, res) => {
	try {
		if(!req.body) {
			res.send({
				status: false,
				message: 'No file uploaded'
			});
		} else {
			// Load departements
			const query = '*[_type == "departement"]'
			const params = {}
			
			// Get departements from Sanity
			const departements = await client.fetch(query, params);
			// Build a table with codes
			const codesDepartements = departements.map((departement) => {
				return departement.code
			})

			// Get Cities from uploaded file
			const cities = req.body
			let transaction = client.transaction()
			let totalCity = 0;
			let setCity = new Set(); // Table to test if city is already aded

			// Loop oper cities
			cities.map((city) => {
				// Build city
				if(typeof city.fields.nom_com === "string" 
					&& city.fields.population_totale > 3000 
					&& !setCity.has(city.fields.code_insee) 
					&& codesDepartements.includes(city.fields.code_departement) ){
					
					totalCity += 1;
					setCity.add(city.fields.code_insee) 

					const slug = slugify(city.fields.nom_com ,{
						replacement: '-',  // Replace spaces with replacement character, defaults to `-`
						remove: undefined, // Remove characters that match regex, defaults to `undefined`
						lower: true,       // Convert to lower case, defaults to `false`
						strict: true,      // Strip special characters except replacement, defaults to `false`
						locale: 'fr'       // Language code of the locale to use
					})

					// Test if cities is in our departement
					if(codesDepartements.includes(city.fields.code_departement)){
						const cityId = `city-${slug}-${city.fields.code_insee}`
						const sanityCity = {
							_id: cityId,
							_type: 'city',
							codeInsee: city.fields.code_insee,
							name: city.fields.nom_com,
							population: city.fields.population_totale,
							departement: {
								"_ref": `dep-${city.fields.code_departement}`,
								"_type":"reference"
							},
							slug: {
								"_type":"slug",
								"current": slug
							},
						}
						transaction.createOrReplace(sanityCity)
					}
				}
			})
			transaction.commit()
			res.status(200).json(totalCity);
		}
	} catch (err) {
		console.error(err)
		res.status(500).send(err);
	}
});


// Test route 
router.post('/one', async (req, res) => {
	const sanityCity = {
		_id: '01qsdqsdqsdqsd',
		_type: 'cities',
		code: '01',
		name: 'AIn',
		departement: {
			"_ref": '84',
			"_type":"reference"
		},
		slug: {
			"_type":"slug",
			"current": 'ain'
		},
	}
	const transaction = client.transaction()
	transaction.create(sanityCity)
	transaction.commit()
	res.status(200).json(req.body);
})

module.exports = router;