// Global variables for Google Maps
let autocomplete;
let selectedStudentCoordinates = null;
let selectedSchoolCoordinates = null;

// School addresses with coordinates
const schoolAddresses = {
    'sehit-ender-alper-ilkokulu': 'Topçu, Ayyıldız, Şehit Ender Alper Sokak, 06796 Etimesgut/Ankara, Türkiye',
    'susuz-sehit-tamer-kilic-ortaokulu': 'Susuz Mahallesi Küme Evleri No 424 Yenimahalle/ANKARA, Türkiye'
};

// Hardcoded school coordinates to avoid API calls
const schoolCoordinates = {
    'sehit-ender-alper-ilkokulu': {
        lat: 39.93030023821543,
        lng: 32.620627004203506
    },
    'susuz-sehit-tamer-kilic-ortaokulu': {
        lat: 40.01886312124337,
        lng: 32.65188141578048
    }
};

// Cache for school coordinates to avoid repeated API calls
let schoolCoordinatesCache = {};

// Price calculation based on distance
function calculatePriceByDistance(distance) {
    if (distance <= 3) {
        return 3500;
    } else if (distance <= 6) {
        return 3800;
    } else if (distance <= 10) {
        return 4100;
    } else if (distance <= 15) {
        return 4500;
    } else {
        return null; // No price for distances over 15km
    }
}

// Google Maps Autocomplete Initialization
function initAutocomplete() {
    // Initialize autocomplete for student address
    const studentAddressInput = document.getElementById('studentAddress');
    
    if (studentAddressInput) {
        // Create autocomplete instance
        autocomplete = new google.maps.places.Autocomplete(studentAddressInput, {
            types: ['address'],
            componentRestrictions: { country: 'tr' }, // Restrict to Turkey
            fields: ['formatted_address', 'geometry', 'address_components']
        });

        // Set bias to Ankara region for better local results
        autocomplete.setBounds(new google.maps.LatLngBounds(
            new google.maps.LatLng(39.7, 32.4), // Southwest Ankara
            new google.maps.LatLng(40.1, 33.1)  // Northeast Ankara
        ));

        // Add place changed listener
        autocomplete.addListener('place_changed', function() {
            handleAddressSelection();
        });

        // Add input event listener for loading state
        studentAddressInput.addEventListener('input', function() {
            showAddressLoading();
        });

        // Hide loading when user stops typing
        let timeoutId;
        studentAddressInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(hideAddressLoading, 1500);
        });
    }

    // Add school selection change listener
    const schoolSelect = document.getElementById('schoolAddress');
    if (schoolSelect) {
        schoolSelect.addEventListener('change', handleSchoolSelection);
    }

    console.log('Google Maps Autocomplete initialized successfully');
}

// Handle address selection
function handleAddressSelection() {
    const place = autocomplete.getPlace();
    
    if (!place.geometry) {
        showAddressError('Lütfen önerilerden bir adres seçin.');
        return;
    }

    hideAddressLoading();
    hideAddressError();

    // Store coordinates
    selectedStudentCoordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
    };

    // Update UI with selected address details
    updateAddressDisplay(place.formatted_address);

    // Auto-calculate distance if school is already selected
    autoCalculateDistance();

    console.log('Address selected:', place.formatted_address, selectedStudentCoordinates);
}

// Handle school selection
function handleSchoolSelection() {
    const schoolSelect = document.getElementById('schoolAddress');
    const selectedSchoolValue = schoolSelect.value;
    
    if (!selectedSchoolValue) {
        selectedSchoolCoordinates = null;
        updateDistanceDisplay(null);
        return;
    }

    // Get school coordinates
    getSchoolCoordinates(selectedSchoolValue).then(coordinates => {
        selectedSchoolCoordinates = coordinates;
        console.log('School selected:', selectedSchoolValue, coordinates);
        
        // Auto-calculate distance if student address is already selected
        autoCalculateDistance();
    }).catch(error => {
        console.error('Error getting school coordinates:', error);
        showAddressError('Okul koordinatları alınamadı. Lütfen tekrar deneyin.');
    });
}

// Get school coordinates using hardcoded values
async function getSchoolCoordinates(schoolKey) {
    // Check cache first
    if (schoolCoordinatesCache[schoolKey]) {
        return schoolCoordinatesCache[schoolKey];
    }

    // Use hardcoded coordinates instead of API calls
    const coordinates = schoolCoordinates[schoolKey];
    if (!coordinates) {
        throw new Error('School coordinates not found');
    }

    // Cache the result
    schoolCoordinatesCache[schoolKey] = coordinates;
    
    return Promise.resolve(coordinates);
}

// Auto-calculate distance when both addresses are available
function autoCalculateDistance() {
    if (selectedStudentCoordinates && selectedSchoolCoordinates) {
        // Use Google Distance Matrix API for real driving distance
        calculateDrivingDistance(selectedStudentCoordinates, selectedSchoolCoordinates);
    } else {
        updateDistanceDisplay(null);
    }
}

// Calculate driving distance using Google Distance Matrix API
function calculateDrivingDistance(studentCoords, schoolCoords) {
    const service = new google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
        origins: [new google.maps.LatLng(studentCoords.lat, studentCoords.lng)],
        destinations: [new google.maps.LatLng(schoolCoords.lat, schoolCoords.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    }, function(response, status) {
        if (status === 'OK') {
            const result = response.rows[0].elements[0];
            
            if (result.status === 'OK') {
                // Extract distance in kilometers
                const distanceValue = result.distance.value / 1000; // Convert meters to km
                
                console.log('Driving distance calculated:', distanceValue, 'km');
                updateDistanceDisplay(distanceValue);
            } else {
                console.error('Distance calculation failed:', result.status);
                // Fallback to straight-line distance
                const straightDistance = calculateHaversineDistance(
                    studentCoords.lat, studentCoords.lng,
                    schoolCoords.lat, schoolCoords.lng
                );
                updateDistanceDisplay(straightDistance, true);
            }
        } else {
            console.error('Distance Matrix API failed:', status);
            // Fallback to straight-line distance
            const straightDistance = calculateHaversineDistance(
                studentCoords.lat, studentCoords.lng,
                schoolCoords.lat, schoolCoords.lng
            );
            updateDistanceDisplay(straightDistance, true);
        }
    });
}

// Update address display with distance information
function updateAddressDisplay(formattedAddress) {
    const addressDetails = document.getElementById('addressDetails');
    const selectedAddress = document.getElementById('selectedAddress');
    const addressCoordinates = document.getElementById('addressCoordinates');

    if (addressDetails && selectedAddress && addressCoordinates) {
        selectedAddress.textContent = formattedAddress;
        addressCoordinates.textContent = `${selectedStudentCoordinates.lat.toFixed(6)}, ${selectedStudentCoordinates.lng.toFixed(6)}`;
        addressDetails.style.display = 'block';
        addressDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Add apartment details update functionality
        setupAddressDetailsUpdates();
    }
}

// Setup real-time updates for complete address display
function setupAddressDetailsUpdates() {
    const apartmentFields = ['buildingName', 'apartmentNumber', 'addressNotes'];
    
    apartmentFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.hasAttribute('data-listener-added')) {
            field.addEventListener('input', updateCompleteAddressDisplay);
            field.setAttribute('data-listener-added', 'true');
        }
    });
}

// Update the complete address display in real-time
function updateCompleteAddressDisplay() {
    const selectedAddressElement = document.getElementById('selectedAddress');
    const addressDetails = document.getElementById('addressDetails');
    
    if (!selectedAddressElement || !addressDetails) return;
    
    const mainAddress = document.getElementById('studentAddress')?.value || '';
    const buildingName = document.getElementById('buildingName')?.value || '';
    const apartmentNumber = document.getElementById('apartmentNumber')?.value || '';
    const addressNotes = document.getElementById('addressNotes')?.value || '';
    
    // Update the display to show complete address
    let displayAddress = mainAddress;
    let apartmentInfo = [];
    
    if (buildingName) {
        apartmentInfo.push(buildingName);
    }
    
    if (apartmentNumber) {
        apartmentInfo.push(`Daire: ${apartmentNumber}`);
    }
    
    if (apartmentInfo.length > 0) {
        displayAddress += ` | ${apartmentInfo.join(', ')}`;
    }
    
    selectedAddressElement.textContent = displayAddress;
    
    // Add or update apartment details in the display
    updateApartmentDetailsInDisplay(buildingName, apartmentNumber, addressNotes);
}

// Add apartment details to the address details section
function updateApartmentDetailsInDisplay(buildingName, apartmentNumber, addressNotes) {
    const addressDetails = document.getElementById('addressDetails');
    if (!addressDetails) return;
    
    // Remove existing apartment info
    const existingApartmentInfo = addressDetails.querySelector('.apartment-details');
    if (existingApartmentInfo) {
        existingApartmentInfo.remove();
    }
    
    // Add new apartment info if any details are provided
    if (buildingName || apartmentNumber || addressNotes) {
        const apartmentDetails = document.createElement('div');
        apartmentDetails.className = 'apartment-details';
        
        let apartmentHTML = '<p><strong>Detay Bilgiler:</strong></p><ul>';
        
        if (buildingName) {
            apartmentHTML += `<li><strong>Apartman/Site:</strong> ${buildingName}</li>`;
        }
        
        if (apartmentNumber) {
            apartmentHTML += `<li><strong>Daire/Blok:</strong> ${apartmentNumber}</li>`;
        }
        
        if (addressNotes) {
            apartmentHTML += `<li><strong>Notlar:</strong> ${addressNotes}</li>`;
        }
        
        apartmentHTML += '</ul>';
        apartmentDetails.innerHTML = apartmentHTML;
        
        // Insert before distance info if it exists, otherwise append
        const distanceInfo = addressDetails.querySelector('.distance-info');
        if (distanceInfo) {
            addressDetails.insertBefore(apartmentDetails, distanceInfo);
        } else {
            addressDetails.appendChild(apartmentDetails);
        }
    }
}

// Update distance display in address details
function updateDistanceDisplay(distance, isStraightLine = false) {
    const addressDetails = document.getElementById('addressDetails');
    
    if (!addressDetails) return;

    // Remove existing distance info
    const existingDistance = addressDetails.querySelector('.distance-info');
    if (existingDistance) {
        existingDistance.remove();
    }

    if (distance !== null) {
        // Add distance information
        const distanceInfo = document.createElement('p');
        distanceInfo.className = 'distance-info';
        
        let distanceLabel = 'Araç ile Mesafe:';
        let additionalInfo = '';
        
        if (isStraightLine) {
            distanceLabel = 'Düz Mesafe:';
            additionalInfo = ' <small>(Kuş uçuşu)</small>';
        }
        
        // Calculate price based on distance
        const price = calculatePriceByDistance(distance);
        let priceInfo = '';
        if (price) {
            priceInfo = `<br><strong>Tahmini Aylık Ücret:</strong> <span class="price-value">${price.toLocaleString('tr-TR')} TL</span>`;
        }
        
        distanceInfo.innerHTML = `<strong>${distanceLabel}</strong> <span class="distance-value">${distance.toFixed(1)} km</span>${additionalInfo}${priceInfo}`;
        addressDetails.appendChild(distanceInfo);
    }
}

// Show/hide loading state
function showAddressLoading() {
    const loading = document.getElementById('addressLoading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

function hideAddressLoading() {
    const loading = document.getElementById('addressLoading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Show/hide error state
function showAddressError(message) {
    let errorDiv = document.querySelector('.address-error');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'address-error';
        const addressContainer = document.querySelector('.address-input-container');
        if (addressContainer && addressContainer.parentNode) {
            addressContainer.parentNode.insertBefore(errorDiv, addressContainer.nextSibling);
        }
    }
    
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideAddressError() {
    const errorDiv = document.querySelector('.address-error');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

// Toggle info notice function
function toggleInfoNotice() {
    const infoContent = document.getElementById('infoContent');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    if (infoContent.style.display === 'none') {
        infoContent.style.display = 'block';
        toggleIcon.textContent = '▲';
    } else {
        infoContent.style.display = 'none';
        toggleIcon.textContent = '▼';
    }
}



// Haversine formula for distance calculation
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// FAQ Accordion Toggle
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const faqAnswer = faqItem.querySelector('.faq-answer');
    const isActive = element.classList.contains('active');
    
    // Close all other FAQ items
    const allFaqQuestions = document.querySelectorAll('.faq-question');
    const allFaqAnswers = document.querySelectorAll('.faq-answer');
    
    allFaqQuestions.forEach(question => {
        question.classList.remove('active');
    });
    
    allFaqAnswers.forEach(answer => {
        answer.classList.remove('active');
    });
    
    // Toggle current item if it wasn't active
    if (!isActive) {
        element.classList.add('active');
        faqAnswer.classList.add('active');
    }
}

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
    }

    // Initialize form functionality
    initializeRegistrationForm();
    initializeContactForm();
    initializeModals();
});

// Registration Form Functions
function initializeRegistrationForm() {
    const registrationForm = document.getElementById('studentRegistrationForm');
    
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistrationSubmit);
    }

    // Add auto-formatting for apartment number field
    const apartmentNumberField = document.getElementById('apartmentNumber');
    if (apartmentNumberField) {
        apartmentNumberField.addEventListener('input', formatApartmentNumber);
    }
}

// Auto-format apartment number input
function formatApartmentNumber(event) {
    let value = event.target.value;
    // Auto-capitalize first letters and format common patterns
    value = value.replace(/\b\w/g, char => char.toUpperCase());
    event.target.value = value;
}

// Enhanced form data collection including apartment details
function collectFormData() {
    const formData = {
        // Student Info
        studentName: document.getElementById('studentName')?.value,
        studentGrade: document.getElementById('studentGrade')?.value,
        studentBranch: document.getElementById('studentBranch')?.value,
        
        // School Info
        schoolAddress: document.getElementById('schoolAddress')?.value,
        
        // Enhanced Address Info
        mainAddress: document.getElementById('studentAddress')?.value,
        buildingName: document.getElementById('buildingName')?.value,
        apartmentNumber: document.getElementById('apartmentNumber')?.value,
        addressNotes: document.getElementById('addressNotes')?.value,
        fullAddress: generateFullAddress(),
        coordinates: selectedStudentCoordinates,
        
        // Parent Info
        motherName: document.getElementById('motherName')?.value,
        motherPhone: document.getElementById('motherPhone')?.value,
        motherEmail: document.getElementById('motherEmail')?.value,
        fatherName: document.getElementById('fatherName')?.value,
        fatherPhone: document.getElementById('fatherPhone')?.value,
        fatherEmail: document.getElementById('fatherEmail')?.value,
        
        // Additional Info
        additionalMessage: document.getElementById('additionalMessage')?.value,
        
        // Distance Info
        calculatedDistance: getCalculatedDistance(),
        estimatedPrice: getEstimatedPrice()
    };
    
    return formData;
}

// Generate full address string combining all address fields
function generateFullAddress() {
    const mainAddress = document.getElementById('studentAddress')?.value || '';
    const buildingName = document.getElementById('buildingName')?.value || '';
    const apartmentNumber = document.getElementById('apartmentNumber')?.value || '';
    const addressNotes = document.getElementById('addressNotes')?.value || '';
    
    let fullAddress = mainAddress;
    
    if (buildingName) {
        fullAddress += `, ${buildingName}`;
    }
    
    if (apartmentNumber) {
        fullAddress += `, ${apartmentNumber}`;
    }
    
    if (addressNotes) {
        fullAddress += ` (${addressNotes})`;
    }
    
    return fullAddress;
}

// Get calculated distance from the UI
function getCalculatedDistance() {
    const distanceElement = document.querySelector('.distance-info .distance-value');
    return distanceElement ? distanceElement.textContent : null;
}

// Get estimated price from the UI
function getEstimatedPrice() {
    const priceElement = document.querySelector('.distance-info .price-value');
    return priceElement ? priceElement.textContent : null;
}

// Enhanced form validation including apartment details
function validateRegistrationForm() {
    let isValid = true;
    
    // Clear previous errors
    clearErrorMessages();
    
    // Required fields validation
    const requiredFields = [
        'studentName',
        'studentGrade', 
        'studentBranch',
        'schoolAddress',
        'studentAddress',
        'apartmentNumber', // New required field
        'motherName',
        'motherPhone',
        'fatherName',
        'fatherPhone'
    ];
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field || !field.value.trim()) {
            showFieldError(field, 'Bu alan zorunludur.');
            isValid = false;
        }
    });
    
    // Apartment number format validation
    const apartmentField = document.getElementById('apartmentNumber');
    if (apartmentField && apartmentField.value.trim()) {
        const apartmentValue = apartmentField.value.trim();
        if (apartmentValue.length < 2) {
            showFieldError(apartmentField, 'Daire/blok numarası çok kısa. Örn: "A5" veya "Kat 2 No 8"');
            isValid = false;
        }
    }
    
    // Phone number validation for mother
    const motherPhoneField = document.getElementById('motherPhone');
    if (motherPhoneField && motherPhoneField.value && !validatePhoneNumber(motherPhoneField.value)) {
        showFieldError(motherPhoneField, 'Geçerli bir telefon numarası giriniz.');
        isValid = false;
    }
    
    // Phone number validation for father
    const fatherPhoneField = document.getElementById('fatherPhone');
    if (fatherPhoneField && fatherPhoneField.value && !validatePhoneNumber(fatherPhoneField.value)) {
        showFieldError(fatherPhoneField, 'Geçerli bir telefon numarası giriniz.');
        isValid = false;
    }
    
    // Email validation for mother
    const motherEmailField = document.getElementById('motherEmail');
    if (motherEmailField && motherEmailField.value && !validateEmail(motherEmailField.value)) {
        showFieldError(motherEmailField, 'Geçerli bir e-posta adresi giriniz.');
        isValid = false;
    }
    
    // Email validation for father
    const fatherEmailField = document.getElementById('fatherEmail');
    if (fatherEmailField && fatherEmailField.value && !validateEmail(fatherEmailField.value)) {
        showFieldError(fatherEmailField, 'Geçerli bir e-posta adresi giriniz.');
        isValid = false;
    }
    
    // Address selection validation
    if (!selectedStudentCoordinates) {
        const addressField = document.getElementById('studentAddress');
        showFieldError(addressField, 'Lütfen adres önerilerinden birini seçin.');
        isValid = false;
    }
    
    // Agreement checkboxes validation
    const contractCheckbox = document.getElementById('contractAgreement');
    const kvkkCheckbox = document.getElementById('kvkkAgreement');
    
    if (!contractCheckbox || !contractCheckbox.checked) {
        showFieldError(contractCheckbox, 'Taşımacılık sözleşmesini kabul etmeniz gerekiyor.');
        isValid = false;
    }
    
    if (!kvkkCheckbox || !kvkkCheckbox.checked) {
        showFieldError(kvkkCheckbox, 'KVKK aydınlatma metnini kabul etmeniz gerekiyor.');
        isValid = false;
    }
    
    return isValid;
}

function handleRegistrationSubmit(e) {
    e.preventDefault();
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Validate form
    const isValid = validateRegistrationForm();
    
    if (isValid) {
        // Collect form data
        const formData = collectFormData();
        
        // Show success message
        showSuccessMessage('Kayıt formunuz başarıyla gönderildi! En kısa sürede sizinle iletişime geçeceğiz.');
        
        // Optional: Redirect to Google Forms or send email
        // window.location.href = 'https://forms.google.com/...';
        // Or create mailto link
        createMailtoLink(formData);
        
        // Reset form
        e.target.reset();
    }
}

function createMailtoLink(formData) {
    const subject = `Öğrenci Kayıt Formu - ${formData.studentName}`;
    
    const body = `
KARTU TURİZM ÖĞRENCİ KAYIT FORMU

Öğrenci Bilgileri:
Ad Soyad: ${formData.studentName}
Sınıf: ${formData.studentGrade}
Şube: ${formData.studentBranch}

Okul Bilgileri:
Okul: ${formData.schoolAddress}

Adres Bilgileri:
Ana Adres: ${formData.mainAddress}
${formData.buildingName ? `Apartman/Site: ${formData.buildingName}` : ''}
Daire/Blok: ${formData.apartmentNumber}
${formData.addressNotes ? `Adres Notları: ${formData.addressNotes}` : ''}
Tam Adres: ${formData.fullAddress}
${formData.calculatedDistance ? `Mesafe: ${formData.calculatedDistance}` : ''}
${formData.estimatedPrice ? `Tahmini Aylık Ücret: ${formData.estimatedPrice}` : ''}

Anne Bilgileri:
Ad Soyad: ${formData.motherName}
Telefon: ${formData.motherPhone}
${formData.motherEmail ? `E-posta: ${formData.motherEmail}` : ''}

Baba Bilgileri:
Ad Soyad: ${formData.fatherName}
Telefon: ${formData.fatherPhone}
${formData.fatherEmail ? `E-posta: ${formData.fatherEmail}` : ''}

${formData.additionalMessage ? `Ek Mesaj: ${formData.additionalMessage}` : ''}

Koordinatlar: ${formData.coordinates ? `${formData.coordinates.lat}, ${formData.coordinates.lng}` : 'Belirtilmedi'}

Bu form otomatik olarak oluşturulmuştur.
Kartu Turizm - ${new Date().toLocaleDateString('tr-TR')}
    `.trim();

    const mailtoLink = `mailto:info@kartuturizm.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink);
}







// Contact Form Functions
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Validate contact form
    const isValid = validateContactForm();
    
    if (isValid) {
        // Collect contact form data
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value
        };
        
        // Create mailto link for contact form
        const subject = encodeURIComponent(`İletişim: ${formData.subject}`);
        const body = encodeURIComponent(`
İsim: ${formData.name}
E-posta: ${formData.email}
Telefon: ${formData.phone}
Konu: ${formData.subject}

Mesaj:
${formData.message}
        `);
        
        const mailtoLink = `mailto:info@kartuturizm.com?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
        
        // Show success message
        showSuccessMessage('Mesajınız gönderildi! En kısa sürede size dönüş yapacağız.');
        
        // Reset form
        e.target.reset();
    }
}

function validateContactForm() {
    let isValid = true;
    
    // Required fields validation
    const requiredFields = [
        'contactName',
        'contactEmail',
        'contactSubject',
        'contactMessage'
    ];
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field.value.trim()) {
            showFieldError(field, 'Bu alan zorunludur.');
            isValid = false;
        }
    });
    
    // Email validation
    const emailField = document.getElementById('contactEmail');
    if (emailField.value && !validateEmail(emailField.value)) {
        showFieldError(emailField, 'Geçerli bir e-posta adresi giriniz.');
        isValid = false;
    }
    
    // Phone validation (optional field)
    const phoneField = document.getElementById('contactPhone');
    if (phoneField.value && !validatePhoneNumber(phoneField.value)) {
        showFieldError(phoneField, 'Geçerli bir telefon numarası giriniz.');
        isValid = false;
    }
    
    return isValid;
}

// Modal Functions
function initializeModals() {
    const showContractBtn = document.getElementById('showContract');
    const showKVKKBtn = document.getElementById('showKVKK');
    const contractModal = document.getElementById('contractModal');
    const kvkkModal = document.getElementById('kvkkModal');
    const closeContractModal = document.getElementById('closeContractModal');
    const closeKVKKModal = document.getElementById('closeKVKKModal');
    
    // Contract modal
    if (showContractBtn && contractModal) {
        showContractBtn.addEventListener('click', function(e) {
            e.preventDefault();
            contractModal.style.display = 'block';
        });
    }
    
    if (closeContractModal && contractModal) {
        closeContractModal.addEventListener('click', function() {
            contractModal.style.display = 'none';
        });
    }
    
    // KVKK modal
    if (showKVKKBtn && kvkkModal) {
        showKVKKBtn.addEventListener('click', function(e) {
            e.preventDefault();
            kvkkModal.style.display = 'block';
        });
    }
    
    if (closeKVKKModal && kvkkModal) {
        closeKVKKModal.addEventListener('click', function() {
            kvkkModal.style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === contractModal) {
            contractModal.style.display = 'none';
        }
        if (event.target === kvkkModal) {
            kvkkModal.style.display = 'none';
        }
    });
}

// Utility Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhoneNumber(phone) {
    // Turkish phone number validation
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$|^(\+90|0)?[2-4][0-9]{8}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
}

function showFieldError(field, message) {
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error class to field
    field.style.borderColor = '#dc3545';
    
    // Create and show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearErrorMessages() {
    // Remove all error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    
    // Reset field styles
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.style.borderColor = '#e9ecef';
    });
}

function showSuccessMessage(message) {
    // Remove existing success message
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Add to form
    const form = document.querySelector('.form, .contact-form');
    if (form) {
        form.appendChild(successDiv);
        
        // Scroll to success message
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form field auto-formatting
document.addEventListener('input', function(e) {
    // Phone number formatting
    if (e.target.type === 'tel') {
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('90')) {
            value = value.substring(2);
        }
        if (value.length > 0) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 6) {
                value = value.substring(0, 3) + ' ' + value.substring(3);
            } else if (value.length <= 8) {
                value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6);
            } else {
                value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6, 8) + ' ' + value.substring(8, 10);
            }
        }
        e.target.value = value;
    }
});

// Prevent form submission on Enter key in text inputs (except textarea)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.type === 'text' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});
