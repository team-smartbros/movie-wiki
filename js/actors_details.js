// Actor Details Fetching Functionality for Movie Wiki
// This file contains the implementation for fetching actor details from Wikidata API

// Function to fetch actor details from Wikidata API
async function fetchActorDetails(actorName) {
    try {
        console.log(`🔍 Searching for actor: ${actorName}`);
        
        // Show loading indicator
        const actorContent = document.getElementById('actorContent');
        if (actorContent) {
            actorContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
                    <p class="text-gray-400">Searching for ${actorName}...</p>
                </div>
            `;
        }
        
        // Search for the actor on Wikidata
        const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(actorName)}&language=en&format=json&type=item&origin=*`;
        console.log(`Search URL: ${searchUrl}`);
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        console.log('Search results:', searchData);
        
        if (!searchData.search || searchData.search.length === 0) {
            // No results found
            if (actorContent) {
                actorContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12">
                        <i class="fas fa-user-slash text-4xl text-gray-500 mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-400 mb-2">Actor Not Found</h2>
                        <p class="text-gray-500">We couldn't find any actor matching "${actorName}".</p>
                        <p class="text-gray-600 mt-2">Try searching for a different actor name.</p>
                    </div>
                `;
            }
            return;
        }
        
        // Get the first result (most relevant)
        const actor = searchData.search[0];
        console.log('Found actor:', actor);
        
        // Fetch detailed information about the actor
        const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${actor.id}&format=json&languages=en&origin=*`;
        console.log(`Entity URL: ${entityUrl}`);
        
        const entityResponse = await fetch(entityUrl);
        const entityData = await entityResponse.json();
        console.log('Entity data:', entityData);
        
        // Extract actor information
        const entity = entityData.entities[actor.id];
        const labels = entity.labels || {};
        const descriptions = entity.descriptions || {};
        const aliases = entity.aliases || {};
        const claims = entity.claims || {};
        const sitelinks = entity.sitelinks || {};
        
        // Log all claims to see what film-related data is available
        console.log('All claims:', Object.keys(claims));
        
        // Extract basic information
        const name = labels.en ? labels.en.value : actor.label;
        const description = descriptions.en ? descriptions.en.value : actor.description;
        
        // Extract aliases
        let aliasList = [];
        if (aliases.en) {
            aliasList = aliases.en.map(alias => alias.value);
        }
        
        // Extract birth date
        let birthDate = '';
        let birthPlace = '';
        if (claims.P569 && claims.P569[0] && claims.P569[0].mainsnak.datavalue) {
            const birthTime = claims.P569[0].mainsnak.datavalue.value.time;
            // Remove the + at the beginning and convert to readable format
            birthDate = birthTime.substring(1, 11); // Extract YYYY-MM-DD
        }
        
        // Extract death date
        let deathDate = '';
        if (claims.P570 && claims.P570[0] && claims.P570[0].mainsnak.datavalue) {
            const deathTime = claims.P570[0].mainsnak.datavalue.value.time;
            // Remove the + at the beginning and convert to readable format
            deathDate = deathTime.substring(1, 11); // Extract YYYY-MM-DD
        }
        
        // Extract place of birth (P19)
        let placeOfBirthId = '';
        if (claims.P19 && claims.P19[0] && claims.P19[0].mainsnak.datavalue) {
            placeOfBirthId = claims.P19[0].mainsnak.datavalue.value.id;
        }
        
        // Extract nationality (P27)
        let nationalityIds = [];
        if (claims.P27) {
            for (const nationalityClaim of claims.P27) {
                if (nationalityClaim.mainsnak.datavalue) {
                    nationalityIds.push(nationalityClaim.mainsnak.datavalue.value.id);
                }
            }
        }
        
        // Extract occupation (P106) - Fix duplicate issue by using a Set
        let occupations = [];
        if (claims.P106) {
            const occupationSet = new Set(); // Use Set to avoid duplicates
            for (const occupationClaim of claims.P106) {
                if (occupationClaim.mainsnak.datavalue) {
                    const occupationId = occupationClaim.mainsnak.datavalue.value.id;
                    occupationSet.add(occupationId);
                }
            }
            // Convert Set to array
            occupations = Array.from(occupationSet);
        }
        
        // Extract IMDb ID (P345)
        let imdbId = '';
        if (claims.P345 && claims.P345[0] && claims.P345[0].mainsnak.datavalue) {
            imdbId = claims.P345[0].mainsnak.datavalue.value;
        }
        
        // Extract height (P2048)
        let height = '';
        if (claims.P2048 && claims.P2048[0] && claims.P2048[0].mainsnak.datavalue) {
            const heightValue = claims.P2048[0].mainsnak.datavalue.value;
            if (heightValue.amount && heightValue.unit) {
                // Convert to a more readable format
                const amount = heightValue.amount.replace('+', '');
                // Get the unit name from the unit ID
                const unitId = heightValue.unit.split('/').pop();
                if (unitId === 'Q11573') {
                    // Convert to centimeters and meters
                    const cm = parseFloat(amount) * 100;
                    height = `${cm} cm (${amount} m)`;
                } else {
                    height = `${amount} ${unitId}`;
                }
            }
        }
        
        // Extract gender (P21)
        let gender = '';
        if (claims.P21 && claims.P21[0] && claims.P21[0].mainsnak.datavalue) {
            const genderId = claims.P21[0].mainsnak.datavalue.value.id;
            // Map common gender IDs to readable names
            if (genderId === 'Q6581097') gender = 'Male';
            else if (genderId === 'Q6581072') gender = 'Female';
            else gender = genderId;
        }
        
        // Extract spouse/partner (P26)
        let spouses = [];
        if (claims.P26) {
            for (const spouseClaim of claims.P26) {
                if (spouseClaim.mainsnak.datavalue) {
                    spouses.push(spouseClaim.mainsnak.datavalue.value.id);
                }
            }
        }
        
        // Extract children (P40)
        let children = [];
        if (claims.P40) {
            for (const childClaim of claims.P40) {
                if (childClaim.mainsnak.datavalue) {
                    children.push(childClaim.mainsnak.datavalue.value.id);
                }
            }
        }
        
        // Extract education (P69)
        let education = [];
        if (claims.P69) {
            for (const educationClaim of claims.P69) {
                if (educationClaim.mainsnak.datavalue) {
                    education.push(educationClaim.mainsnak.datavalue.value.id);
                }
            }
        }
        
        // Extract website (P856)
        let website = '';
        if (claims.P856 && claims.P856[0] && claims.P856[0].mainsnak.datavalue) {
            website = claims.P856[0].mainsnak.datavalue.value;
        }
        
        // Extract Twitter username (P2002)
        let twitter = '';
        if (claims.P2002 && claims.P2002[0] && claims.P2002[0].mainsnak.datavalue) {
            twitter = claims.P2002[0].mainsnak.datavalue.value;
        }
        
        // Extract Instagram username (P2003)
        let instagram = '';
        if (claims.P2003 && claims.P2003[0] && claims.P2003[0].mainsnak.datavalue) {
            instagram = claims.P2003[0].mainsnak.datavalue.value;
        }
        
        // Extract Facebook ID (P2013)
        let facebook = '';
        if (claims.P2013 && claims.P2013[0] && claims.P2013[0].mainsnak.datavalue) {
            facebook = claims.P2013[0].mainsnak.datavalue.value;
        }
        
        // Extract notable works (P800)
        let notableWorks = [];
        if (claims.P800) {
            for (const workClaim of claims.P800) {
                if (workClaim.mainsnak.datavalue) {
                    notableWorks.push(workClaim.mainsnak.datavalue.value.id);
                }
            }
        }
        
        // Extract awards received (P166)
        let awards = [];
        if (claims.P166) {
            for (const awardClaim of claims.P166) {
                if (awardClaim.mainsnak.datavalue) {
                    awards.push(awardClaim.mainsnak.datavalue.value.id);
                }
            }
        }
        
        // Extract image from Wikipedia if available
        let imageUrl = '';
        if (sitelinks.enwiki) {
            // Try to get image from English Wikipedia
            try {
                const wikiTitle = sitelinks.enwiki.title;
                const wikiImageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
                const wikiResponse = await fetch(wikiImageUrl);
                const wikiData = await wikiResponse.json();
                if (wikiData.thumbnail && wikiData.thumbnail.source) {
                    imageUrl = wikiData.thumbnail.source;
                }
            } catch (wikiError) {
                console.log('Could not fetch Wikipedia image:', wikiError);
            }
        }
        
        // If no image from Wikipedia, try to get from Commons
        if (!imageUrl && sitelinks.commonswiki) {
            try {
                const commonsTitle = sitelinks.commonswiki.title;
                if (commonsTitle) {
                    // Try to get the image URL from Commons
                    const commonsImageUrl = `https://commons.wikimedia.org/api/rest_v1/page/summary/${encodeURIComponent(commonsTitle)}`;
                    const commonsResponse = await fetch(commonsImageUrl);
                    const commonsData = await commonsResponse.json();
                    if (commonsData.thumbnail && commonsData.thumbnail.source) {
                        imageUrl = commonsData.thumbnail.source;
                    }
                }
            } catch (commonsError) {
                console.log('Could not fetch Commons image:', commonsError);
            }
        }
        
        // If still no image, use a default placeholder
        if (!imageUrl) {
            imageUrl = 'https://placehold.co/600x400?text=Actor+Image&font=opensans';
        }
        
        // Get additional details like place of birth name
        let placeOfBirthName = '';
        if (placeOfBirthId) {
            try {
                const placeUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${placeOfBirthId}&format=json&languages=en&origin=*`;
                const placeResponse = await fetch(placeUrl);
                const placeData = await placeResponse.json();
                if (placeData.entities && placeData.entities[placeOfBirthId]) {
                    const placeEntity = placeData.entities[placeOfBirthId];
                    if (placeEntity.labels && placeEntity.labels.en) {
                        placeOfBirthName = placeEntity.labels.en.value;
                    }
                }
            } catch (placeError) {
                console.log('Could not fetch place of birth name:', placeError);
                placeOfBirthName = placeOfBirthId; // Fallback to ID
            }
        }
        
        // Get nationality names
        let nationalityNames = [];
        if (nationalityIds.length > 0) {
            try {
                const nationalityIdsString = nationalityIds.join('|');
                const nationalityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${nationalityIdsString}&format=json&languages=en&origin=*`;
                const nationalityResponse = await fetch(nationalityUrl);
                const nationalityData = await nationalityResponse.json();
                if (nationalityData.entities) {
                    for (const nationalityId of nationalityIds) {
                        if (nationalityData.entities[nationalityId] && nationalityData.entities[nationalityId].labels && nationalityData.entities[nationalityId].labels.en) {
                            nationalityNames.push(nationalityData.entities[nationalityId].labels.en.value);
                        } else {
                            nationalityNames.push(nationalityId); // Fallback to ID
                        }
                    }
                }
            } catch (nationalityError) {
                console.log('Could not fetch nationality names:', nationalityError);
                nationalityNames = nationalityIds; // Fallback to IDs
            }
        }
        
        // Get spouse names
        let spouseNames = [];
        if (spouses.length > 0) {
            try {
                const spouseIdsString = spouses.join('|');
                const spouseUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${spouseIdsString}&format=json&languages=en&origin=*`;
                const spouseResponse = await fetch(spouseUrl);
                const spouseData = await spouseResponse.json();
                if (spouseData.entities) {
                    for (const spouseId of spouses) {
                        if (spouseData.entities[spouseId] && spouseData.entities[spouseId].labels && spouseData.entities[spouseId].labels.en) {
                            spouseNames.push(spouseData.entities[spouseId].labels.en.value);
                        } else {
                            spouseNames.push(spouseId); // Fallback to ID
                        }
                    }
                }
            } catch (spouseError) {
                console.log('Could not fetch spouse names:', spouseError);
                spouseNames = spouses; // Fallback to IDs
            }
        }
        
        // Get education institution names
        let educationNames = [];
        if (education.length > 0) {
            try {
                const educationIdsString = education.join('|');
                const educationUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${educationIdsString}&format=json&languages=en&origin=*`;
                const educationResponse = await fetch(educationUrl);
                const educationData = await educationResponse.json();
                if (educationData.entities) {
                    for (const educationId of education) {
                        if (educationData.entities[educationId] && educationData.entities[educationId].labels && educationData.entities[educationId].labels.en) {
                            educationNames.push(educationData.entities[educationId].labels.en.value);
                        } else {
                            educationNames.push(educationId); // Fallback to ID
                        }
                    }
                }
            } catch (educationError) {
                console.log('Could not fetch education names:', educationError);
                educationNames = education; // Fallback to IDs
            }
        }
        
        // Get occupation names
        let occupationNames = [];
        if (occupations.length > 0) {
            try {
                const occupationIdsString = occupations.join('|');
                const occupationUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${occupationIdsString}&format=json&languages=en&origin=*`;
                const occupationResponse = await fetch(occupationUrl);
                const occupationData = await occupationResponse.json();
                if (occupationData.entities) {
                    for (const occupationId of occupations) {
                        if (occupationData.entities[occupationId] && occupationData.entities[occupationId].labels && occupationData.entities[occupationId].labels.en) {
                            occupationNames.push(occupationData.entities[occupationId].labels.en.value);
                        } else {
                            occupationNames.push(occupationId); // Fallback to ID
                        }
                    }
                }
            } catch (occupationError) {
                console.log('Could not fetch occupation names:', occupationError);
                occupationNames = occupations; // Fallback to IDs
            }
        }
        
        // Get notable works names
        let notableWorkNames = [];
        if (notableWorks.length > 0) {
            try {
                // Limit to first 15 works to avoid overwhelming the API
                const limitedWorks = notableWorks.slice(0, 15);
                const workIdsString = limitedWorks.join('|');
                const workUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${workIdsString}&format=json&languages=en&origin=*`;
                const workResponse = await fetch(workUrl);
                const workData = await workResponse.json();
                if (workData.entities) {
                    for (const workId of limitedWorks) {
                        if (workData.entities[workId]) {
                            const workEntity = workData.entities[workId];
                            if (workEntity.labels && workEntity.labels.en) {
                                notableWorkNames.push({
                                    id: workId,
                                    title: workEntity.labels.en.value,
                                    description: workEntity.descriptions && workEntity.descriptions.en ? workEntity.descriptions.en.value : ''
                                });
                            } else {
                                notableWorkNames.push({
                                    id: workId,
                                    title: workId,
                                    description: ''
                                });
                            }
                        }
                    }
                }
            } catch (workError) {
                console.log('Could not fetch notable works:', workError);
                // Fallback to IDs only
                notableWorkNames = notableWorks.slice(0, 15).map(id => ({
                    id: id,
                    title: id,
                    description: ''
                }));
            }
        }
        
        // Get awards names
        let awardNames = [];
        if (awards.length > 0) {
            try {
                // Limit to first 10 awards to avoid overwhelming the API
                const limitedAwards = awards.slice(0, 10);
                const awardIdsString = limitedAwards.join('|');
                const awardUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${awardIdsString}&format=json&languages=en&origin=*`;
                const awardResponse = await fetch(awardUrl);
                const awardData = await awardResponse.json();
                if (awardData.entities) {
                    for (const awardId of limitedAwards) {
                        if (awardData.entities[awardId]) {
                            const awardEntity = awardData.entities[awardId];
                            if (awardEntity.labels && awardEntity.labels.en) {
                                awardNames.push({
                                    id: awardId,
                                    title: awardEntity.labels.en.value,
                                    description: awardEntity.descriptions && awardEntity.descriptions.en ? awardEntity.descriptions.en.value : ''
                                });
                            } else {
                                awardNames.push({
                                    id: awardId,
                                    title: awardId,
                                    description: ''
                                });
                            }
                        }
                    }
                }
            } catch (awardError) {
                console.log('Could not fetch awards:', awardError);
                // Fallback to IDs only
                awardNames = awards.slice(0, 10).map(id => ({
                    id: id,
                    title: id,
                    description: ''
                }));
            }
        }
        
        // Display actor information
        displayActorDetails({
            id: actor.id,
            name: name,
            description: description,
            aliases: aliasList,
            birthDate: birthDate,
            deathDate: deathDate,
            placeOfBirth: placeOfBirthName || placeOfBirthId,
            nationalities: nationalityNames,
            occupations: occupationNames,
            imdbId: imdbId,
            height: height,
            gender: gender,
            spouses: spouseNames,
            children: children.length,
            education: educationNames,
            website: website,
            twitter: twitter,
            instagram: instagram,
            facebook: facebook,
            notableWorks: notableWorkNames,
            awards: awardNames,
            imageUrl: imageUrl
        });
        
    } catch (error) {
        console.error('Error fetching actor details:', error);
        const actorContent = document.getElementById('actorContent');
        if (actorContent) {
            actorContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-red-500 mb-2">Error Loading Actor Details</h2>
                    <p class="text-gray-500">An error occurred while fetching actor details.</p>
                    <p class="text-gray-600 mt-2">Please try again later.</p>
                </div>
            `;
        }
    }
}

// Function to display actor details
function displayActorDetails(actor) {
    const actorContent = document.getElementById('actorContent');
    if (!actorContent) return;
    
    // Format birth and death dates
    let birthInfo = '';
    if (actor.birthDate) {
        const birthDate = new Date(actor.birthDate);
        birthInfo = birthDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    let deathInfo = '';
    if (actor.deathDate) {
        const deathDate = new Date(actor.deathDate);
        deathInfo = deathDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Create occupation tags
    let occupationTags = '';
    if (actor.occupations && actor.occupations.length > 0) {
        occupationTags = actor.occupations.map(occ => 
            `<span class="inline-block bg-gradient-to-r from-accent to-cyan-400 text-primary text-xs font-bold px-2 py-1 rounded-full mr-1 mt-1 shadow-sm">${occ}</span>`
        ).join('');
    }
    
    // Create nationality tags
    let nationalityTags = '';
    if (actor.nationalities && actor.nationalities.length > 0) {
        nationalityTags = actor.nationalities.map(nat => 
            `<span class="inline-block bg-gray-700 text-white text-xs px-2 py-1 rounded-full mr-1 mt-1">${nat}</span>`
        ).join('');
    }
    
    // Create aliases list
    let aliasesList = '';
    if (actor.aliases && actor.aliases.length > 0) {
        aliasesList = actor.aliases.join(', ');
    }
    
    // Create spouse list
    let spouseList = '';
    if (actor.spouses && actor.spouses.length > 0) {
        spouseList = actor.spouses.join(', ');
    }
    
    // Create education list
    let educationList = '';
    if (actor.education && actor.education.length > 0) {
        educationList = actor.education.join(', ');
    }
    
    // Create social media links
    let socialMediaLinks = '';
    if (actor.website) {
        socialMediaLinks += `<a href="${actor.website}" target="_blank" class="text-accent hover:text-cyan-400 mr-4"><i class="fas fa-globe"></i> Website</a>`;
    }
    if (actor.twitter) {
        socialMediaLinks += `<a href="https://twitter.com/${actor.twitter}" target="_blank" class="text-accent hover:text-cyan-400 mr-4"><i class="fab fa-twitter"></i> Twitter</a>`;
    }
    if (actor.instagram) {
        socialMediaLinks += `<a href="https://instagram.com/${actor.instagram}" target="_blank" class="text-accent hover:text-cyan-400 mr-4"><i class="fab fa-instagram"></i> Instagram</a>`;
    }
    if (actor.facebook) {
        socialMediaLinks += `<a href="https://facebook.com/${actor.facebook}" target="_blank" class="text-accent hover:text-cyan-400"><i class="fab fa-facebook"></i> Facebook</a>`;
    }
    
    // Create notable works list with links to movie details
    let notableWorksList = '';
    if (actor.notableWorks && actor.notableWorks.length > 0) {
        // Show first 10 notable works
        notableWorksList = actor.notableWorks.slice(0, 10).map(work => 
            `<div class="bg-secondary rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-700 transition-colors" onclick="searchAndNavigateToMovie('${work.title.replace(/'/g, "\\'")}')">
                <h4 class="font-semibold text-accent">${work.title}</h4>
                ${work.description ? `<p class="text-sm text-gray-400 mt-1">${work.description}</p>` : ''}
            </div>`
        ).join('');
    }
    
    // Create awards list
    let awardsList = '';
    if (actor.awards && actor.awards.length > 0) {
        // Show first 5 awards
        awardsList = actor.awards.slice(0, 5).map(award => 
            `<div class="bg-secondary rounded-lg p-3 mb-2">
                <h4 class="font-semibold text-accent">${award.title}</h4>
                ${award.description ? `<p class="text-sm text-gray-400 mt-1">${award.description}</p>` : ''}
            </div>`
        ).join('');
    }
    
    actorContent.innerHTML = `
        <div class="flex flex-col md:flex-row">
            <div class="md:w-1/3 p-6 flex justify-center">
                <img src="${actor.imageUrl}" alt="${actor.name}" class="actor-image rounded-lg shadow-lg w-full max-w-xs">
            </div>
            <div class="md:w-2/3 p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h2 class="text-3xl font-bold text-accent font-sans">${actor.name}</h2>
                        ${actor.description ? `<p class="text-gray-400 mt-2">${actor.description}</p>` : ''}
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-accent mb-2 font-sans">Personal Information</h3>
                    <div class="grid grid-cols-1 gap-3">
                        ${birthInfo ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Born:</span>
                            <span>${birthInfo}</span>
                        </div>` : ''}
                        ${actor.placeOfBirth ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Place of Birth:</span>
                            <span>${actor.placeOfBirth}</span>
                        </div>` : ''}
                        ${deathInfo ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Died:</span>
                            <span>${deathInfo}</span>
                        </div>` : ''}
                        ${actor.height ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Height:</span>
                            <span>${actor.height}</span>
                        </div>` : ''}
                        ${actor.gender ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Gender:</span>
                            <span>${actor.gender}</span>
                        </div>` : ''}
                        ${nationalityTags ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Nationality:</span>
                            <span>${nationalityTags}</span>
                        </div>` : ''}
                        ${occupationTags ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Occupation:</span>
                            <span>${occupationTags}</span>
                        </div>` : ''}
                        ${spouseList ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Spouse(s):</span>
                            <span>${spouseList}</span>
                        </div>` : ''}
                        ${actor.children ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Children:</span>
                            <span>${actor.children}</span>
                        </div>` : ''}
                        ${educationList ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Education:</span>
                            <span>${educationList}</span>
                        </div>` : ''}
                        ${aliasesList ? `<div class="flex flex-wrap">
                            <span class="font-semibold w-32">Also Known As:</span>
                            <span>${aliasesList}</span>
                        </div>` : ''}
                    </div>
                </div>
                
                ${socialMediaLinks ? `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-accent mb-2 font-sans">Social Media</h3>
                    <div class="flex flex-wrap gap-4">
                        ${socialMediaLinks}
                    </div>
                </div>
                ` : ''}
                
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-accent mb-2 font-sans">About</h3>
                    <p class="leading-relaxed">
                        ${actor.description || 'No detailed information available for this actor.'}
                    </p>
                    ${actor.aliases && actor.aliases.length > 0 ? `
                    <div class="mt-4">
                        <h4 class="font-semibold text-accent">Aliases:</h4>
                        <p>${aliasesList}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <!-- Notable Works Section -->
        <div class="px-6 pb-6">
            <h3 class="text-lg font-semibold text-accent mb-4 font-sans">Notable Works</h3>
            ${notableWorksList ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${notableWorksList}
            </div>
            ` : `
            <div class="flex flex-col items-center justify-center py-8">
                <i class="fas fa-film text-3xl text-gray-500 mb-4"></i>
                <p class="text-gray-500">No notable works data available.</p>
            </div>
            `}
        </div>
        
        <!-- Awards Section -->
        <div class="px-6 pb-6">
            <h3 class="text-lg font-semibold text-accent mb-4 font-sans">Awards</h3>
            ${awardsList ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${awardsList}
            </div>
            ` : `
            <div class="flex flex-col items-center justify-center py-8">
                <i class="fas fa-trophy text-3xl text-gray-500 mb-4"></i>
                <p class="text-gray-500">No awards data available.</p>
            </div>
            `}
        </div>
    `;
}

// Initialize actor details when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get actor name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const actorName = urlParams.get('name');
    
    // If actor name is provided, fetch details
    if (actorName) {
        // Decode the actor name and fetch details
        const decodedActorName = decodeURIComponent(actorName);
        fetchActorDetails(decodedActorName);
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    // Get actor name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const actorName = urlParams.get('name');
    
    // If actor name is provided, fetch details
    if (actorName) {
        // Decode the actor name and fetch details
        const decodedActorName = decodeURIComponent(actorName);
        fetchActorDetails(decodedActorName);
    } else {
        // Clear the content if no actor name is provided
        const actorContent = document.getElementById('actorContent');
        if (actorContent) {
            actorContent.innerHTML = '';
        }
    }
});

// Export functions for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchActorDetails, displayActorDetails };
}

// Function to search for a movie by title and navigate to its details page
async function searchAndNavigateToMovie(title) {
    try {
        // Show a loading indicator
        const actorContent = document.getElementById('actorContent');
        if (actorContent) {
            const originalContent = actorContent.innerHTML;
            actorContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
                    <p class="text-gray-400">Searching for "${title}"...</p>
                </div>
            `;
            
            // Search for the movie using the API
            const API_BASE = 'https://imdb.iamidiotareyoutoo.com';
            const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(title)}`;
            
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            if (data.ok && data.description && data.description.length > 0) {
                // Get the first result (most relevant)
                const movie = data.description[0];
                const imdbId = movie['#IMDB_ID'];
                
                if (imdbId) {
                    // Navigate to the movie details page
                    window.location.href = `../pages/details.html?id=${imdbId}&title=${encodeURIComponent(title)}`;
                } else {
                    // Fallback: navigate using just the title
                    window.location.href = `../pages/details.html?title=${encodeURIComponent(title)}`;
                }
            } else {
                // If search fails, try navigating with just the title
                window.location.href = `../pages/details.html?title=${encodeURIComponent(title)}`;
            }
        }
    } catch (error) {
        console.error('Error searching for movie:', error);
        // Fallback: navigate using just the title
        window.location.href = `../pages/details.html?title=${encodeURIComponent(title)}`;
    }
}
