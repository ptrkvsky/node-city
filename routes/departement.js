require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const router = require('express').Router();
const slugify = require('slugify')
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: process.env.SANITY_PROJECTID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_TOKEN, // we need this to get write access
  useCdn: false // We can't use the CDN for writing
})

router.post('/delete-all', async (req, res) => {
	try {
		// Load regions
		const query = '*[_type == "departement"]'
		const params = {}
		
		// Get Regions
		const departements = await client.fetch(query, params);

		departements.map( (departement) => {
			client.delete(departement._id).then(res => {
				console.log('Bike deleted')
			})
			.catch(err => {
				console.error('Delete failed: ', err.message)
			})
		})
		res.status(200).json(req.body);
	} catch (err) {
		console.error(err)
		res.status(500).send(err);
	}
})

// Upload departements
router.post('/upload', async (req, res) => {
	try {
		if(!req.body) {
			res.send({
				status: false,
				message: 'No file uploaded'
			});
		} else {
			// Load regions
			const query = '*[_type == "region"]'
			const params = {}
			
			// Get Regions
			const regions = await client.fetch(query, params);
			// Build table with code
			const codesRegions = regions.map((region) => {
				return region.code
			})

			const departements = req.body
			let transaction = client.transaction()

			departements.map((departement) => {
				if(departement.region_code !== 'COM'){
					const slug = slugify(departement.name ,{
						replacement: '-',  // Replace spaces with replacement character, defaults to `-`
						remove: undefined, // Remove characters that match regex, defaults to `undefined`
						lower: true,       // Convert to lower case, defaults to `false`
						strict: true,     // Strip special characters except replacement, defaults to `false`
						locale: 'fr'       // Language code of the locale to use
					})

					// Test if departement is in our region
					if(codesRegions.includes(departement.region_code)){
						const depId = `dep-${departement.code}`
						const sanityDepartement = {
							_id: depId,
							_type: 'departement',
							code: departement.code,
							name: departement.name,
							region: {
								"_ref": departement.region_code,
								"_type":"reference"
							},
							slug: {
								"_type":"slug",
								"current": slug
							},
						}
						transaction.createOrReplace(sanityDepartement)
					}
				}
			})

			transaction.commit()
			res.status(200).json(req.body);
		}
	} catch (err) {
		console.error(err)
		res.status(500).send(err);
	}
});


// Test route 
router.post('/one', async (req, res) => {
	const sanityDepartement = {
		_id: '01qsdqsdqsdqsd',
		_type: 'departement',
		code: '01',
		name: 'AIn',
		region: {
			"_ref": '84',
			"_type":"reference"
		},
		slug: {
			"_type":"slug",
			"current": 'ain'
		},
	}
	const transaction = client.transaction()
	transaction.create(sanityDepartement)
	transaction.commit()
	res.status(200).json(req.body);
})

// Test route 
router.get('/stringgen', async (req, res) => {
	let string = "{Prenez contact avec|Contactez|Trouvez} {une société|une entreprise} pour {l'élagage de|élaguer} votre {haie|jardin|espace-vert} en $nomDpt - $numDpt"
	let finalString = null
	let i = 0;
	while(string.includes("{")){
		// je récupère ce qu'il y a entre deux accolades
		let pat = "{.*?}"
		let [boutDeChaineAvecAccolade] = string.match(pat);
		// je créé un array en splitant sur le pipe
		let splited = boutDeChaineAvecAccolade.split("|");
		// je prends un chiffre au hasard sur l'index de l'array
		let randomIndex = randomIntFromInterval(0,splited.length-1)
		// Je prends une chaine au hasard
		let randomString = splited[randomIndex]
		// j'enlève les accolades de ma chaine retournée
		let cleanString = randomString.replace("{","").replace("}","");
		// J'enlève de ma chaine de base la partie entre les accolades
		// je la remplace avec la nouvelle partie
		string= string.replace(boutDeChaineAvecAccolade,cleanString)
	}


	res.status(200).json(string);
})

module.exports = router;