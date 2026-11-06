import os

new_categories_code = '''    {
        "name": "Metal Handrails",
        "name_am": "የብረት የእጅ መደገፊያዎች",
        "slug": "metal-handrails",
        "service_category": ServiceCategoryChoice.METAL_WORKS,
        "cover_file": "cover-metal-handrails.jpg",
        "description": "Architectural steel handrails, balustrades, staircase safety railings, and commercial guardrails.",
        "description_am": "የደረጃ እና የረንዳ የብረት የእጅ መደገፊያዎች፣ የጥበቃ አጥሮች እና ዘመናዊ የደህንነት ባሉስትሬዶች።",
    },
    # HYBRID WORKS (5)
    {
        "name": "Hybrid Chairs",
        "name_am": "የእንጨት እና ብረት ወንበሮች",
        "slug": "hybrid-chairs",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "cover_file": "cover-hybrid-chairs.jpg",
        "description": "Contemporary industrial seating marrying heavy-gauge welded steel frames with contoured solid timber.",
        "description_am": "ጠንካራ የብረት ፍሬም እና ውብ የእንጨት መቀመጫ ያላቸው ዘመናዊ የኢንዱስትሪ ዲዛይን ወንበሮች።",
    },
    {
        "name": "Hybrid Tables",
        "name_am": "የእንጨት እና ብረት ጠረጴዛዎች",
        "slug": "hybrid-tables",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "cover_file": "cover-hybrid-tables.jpg",
        "description": "Live-edge and solid hardwood slab dining and conference tables with structural welded steel bases.",
        "description_am": "በጠንካራ የብረት እግሮች የተደገፉ ውብ የተፈጥሮ እንጨት የመመገቢያ እና የስብሰባ ጠረጴዛዎች።",
    },
    {
        "name": "Hybrid Beds",
        "name_am": "የእንጨት እና ብረት አልጋዎች",
        "slug": "hybrid-beds",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "cover_file": "cover-hybrid-beds.jpg",
        "description": "Architectural platform beds, canopy frames, and lofts built with steel structure and warm timber elements.",
        "description_am": "የብረት እና የእንጨት ውህደት ያላቸው ዘመናዊ ፕላትፎርም፣ ካኖፒ እና ሎፍት አልጋዎች።",
    },
    {
        "name": "Hybrid Shelving",
        "name_am": "የእንጨት እና ብረት መደርደሪያዎች",
        "slug": "hybrid-shelving",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "cover_file": "cover-hybrid-shelving.jpg",
        "description": "Industrial modular wall units, bookcases, and heavy-duty display shelving combining steel and timber.",
        "description_am": "የብረት ፍሬም እና ጠንካራ የእንጨት ሰሌዳ ያላቸው ሞዱላር የመጻሕፍት እና የእቃ መደርደሪያዎች።",
    },
    {
        "name": "Hybrid Wardrobes & Cabinets",
        "name_am": "የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች",
        "slug": "hybrid-wardrobes-cabinets",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "cover_file": "cover-hybrid-wardrobes.jpg",
        "description": "Industrial mesh-front wardrobes, steel-framed credenzas, and contemporary timber armoires.",
        "description_am": "ጠንካራ የብረት መዋቅር እና ውብ የእንጨት ፊት ለፊት ያላቸው ቁም ሳጥኖች፣ ካቢኔቶች እና ሳይድቦርዶች።",
    },'''

new_products_code = '''    # ==========================================
    # 13. METAL HANDRAILS (5) - Metal Works
    # ==========================================
    {
        "sku": "MHR-001",
        "name": "Modern Architectural Steel Handrail",
        "name_am": "ዘመናዊ የብረት ደረጃ የእጅ መደገፊያ",
        "category_name": "Metal Handrails",
        "category_name_am": "የብረት የእጅ መደገፊያዎች",
        "service_category": ServiceCategoryChoice.METAL_WORKS,
        "image_file": "MHR-001.jpg",
        "material": "Precision Heavy-Gauge Tubular Steel",
        "dimensions": (200, 5, 95),
        "price": Decimal("8500.00"),
        "description": "Precision fabricated tubular steel railing with corrosion-resistant powder coat finish and secure mounting brackets.",
        "description_am": "ዝገት በማይዝግ ፓውደር ኮቲንግ የተጠናቀቀ እና አስተማማኝ የመገጣጠሚያ ቅንፎች ያሉት የብረት ደረጃ የእጅ መደገፊያ።",
    },
    {
        "sku": "MHR-002",
        "name": "Geometric Decorative Metal Balustrade",
        "name_am": "ጂኦሜትሪክ ዲዛይን ያለው የብረት መደገፊያ",
        "category_name": "Metal Handrails",
        "category_name_am": "የብረት የእጅ መደገፊያዎች",
        "service_category": ServiceCategoryChoice.METAL_WORKS,
        "image_file": "MHR-002.jpg",
        "material": "Laser-Cut Steel Plate & Tube",
        "dimensions": (200, 6, 95),
        "price": Decimal("11500.00"),
        "description": "Custom laser-profiled steel balustrade combining modern safety codes with architectural elegance.",
        "description_am": "ዘመናዊ የደህንነት ደረጃዎችን ከውብ ቅርጽ ጋር አጣምሮ የያዘ በሌዘር የተቆረጠ የብረት ደረጃ ባሉስትሬድ።",
    },
    {
        "sku": "MHR-003",
        "name": "Minimalist Industrial Wall Handrail",
        "name_am": "ሚኒማሊስት የብረት ግድግዳ መደገፊያ",
        "category_name": "Metal Handrails",
        "category_name_am": "የብረት የእጅ መደገፊያዎች",
        "service_category": ServiceCategoryChoice.METAL_WORKS,
        "image_file": "MHR-003.jpg",
        "material": "Continuous Seamless Steel Pipe",
        "dimensions": (250, 5, 90),
        "price": Decimal("7500.00"),
        "description": "Heavy-gauge steel tube wall-mounted handrail designed for high-traffic staircases with ergonomic grip.",
        "description_am": "ለብዙ ሰው እንቅስቃሴ ምቹ እና ጠንካራ መያዣ ያለው በግድግዳ ላይ የሚገጠም የብረት ደረጃ መደገፊያ።",
    },
    {
        "sku": "MHR-004",
        "name": "Classic Forged Wrought Iron Railing",
        "name_am": "ክላሲክ የተቀረጸ የብረት ደረጃ መደገፊያ",
        "category_name": "Metal Handrails",
        "category_name_am": "የብረት የእጅ መደገፊያዎች",
        "service_category": ServiceCategoryChoice.METAL_WORKS,
        "image_file": "MHR-004.jpg",
        "material": "Hand-Forged Solid Wrought Iron",
        "dimensions": (200, 6, 100),
        "price": Decimal("14500.00"),
        "description": "Traditional scrollwork and wrought iron craftsmanship for interior grand stairs and exterior landings.",
        "description_am": "ለዋና ደረጃዎች እና ለመግቢያ በሮች የሚሆን በእጅ የተሰራ ጥበባዊ የብረት ቅርጽ እና የእጅ መደገፊያ።",
    },
    {
        "sku": "MHR-005",
        "name": "Exterior Galvanized Balcony Railing",
        "name_am": "ለረንዳ የሚሆን ጠንካራ የጋልቫናይዝድ ብረት መደገፊያ",
        "category_name": "Metal Handrails",
        "category_name_am": "የብረት የእጅ መደገፊያዎች",
        "service_category": ServiceCategoryChoice.METAL_WORKS,
        "image_file": "MHR-005.jpg",
        "material": "Hot-Dip Galvanized & Powder-Coated Steel",
        "dimensions": (220, 8, 105),
        "price": Decimal("12500.00"),
        "description": "Weatherproof galvanized steel protective barrier rail engineered for exterior decks, terraces, and verandas.",
        "description_am": "ለረንዳ እና ለውጭ መደገፊያ ተብሎ የተሰራ፣ ዝናብና ፀሐይን የሚቋቋም የጋልቫናይዝድ ብረት መከላከያ አጥር።",
    },

    # ==========================================
    # 14. HYBRID CHAIRS (5) - Hybrid Works
    # ==========================================
    {
        "sku": "HCH-001",
        "name": "Industrial Steel & Oak Dining Chair",
        "name_am": "የብረት ፍሬም እና የኦክ እንጨት መመገቢያ ወንበር",
        "category_name": "Hybrid Chairs",
        "category_name_am": "የእንጨት እና ብረት ወንበሮች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HCH-001.jpg",
        "material": "Matte Black Steel & Solid White Oak",
        "dimensions": (52, 50, 86),
        "price": Decimal("8200.00"),
        "description": "Matte black steel tube frame combined with solid oak seat and curved backrest for durable modern dining.",
        "description_am": "ጥቁር የብረት ፍሬም ከጠንካራ የኦክ እንጨት መቀመጫ እና የጀርባ መደገፊያ ጋር የተጣመረ ዘመናዊ የመመገቢያ ወንበር።",
    },
    {
        "sku": "HCH-002",
        "name": "Minimalist Metal Wood Armchair",
        "name_am": "ዘመናዊ የብረትና እንጨት እጅ መደገፊያ ያለው ወንበር",
        "category_name": "Hybrid Chairs",
        "category_name_am": "የእንጨት እና ብረት ወንበሮች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HCH-002.jpg",
        "material": "Welded Steel Box Section & Varnished Hardwood",
        "dimensions": (62, 58, 84),
        "price": Decimal("9800.00"),
        "description": "Welded square metal chassis supporting contoured timber armrests and deep supportive wood seating.",
        "description_am": "የካሬ ብረት መዋቅር እና ምቹ የእንጨት እጅ መደገፊያ ያለው ውብ የሳሎን ወንበር።",
    },
    {
        "sku": "HCH-003",
        "name": "Ergonomic Hybrid Study Chair",
        "name_am": "ምቹ የብረትና እንጨት የጥናት ወንበር",
        "category_name": "Hybrid Chairs",
        "category_name_am": "የእንጨት እና ብረት ወንበሮች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HCH-003.jpg",
        "material": "Powder-Coated Tubular Steel & Solid Walnut",
        "dimensions": (54, 52, 90),
        "price": Decimal("9000.00"),
        "description": "Heavy-duty metal structural base with natural varnished hardwood seat and ergonomic lumbar timber support.",
        "description_am": "ጠንካራ የብረት እግሮች እና ተፈጥሯዊ የዋልነት እንጨት መቀመጫ ያለው ለጥናት እና ለስራ የሚሆን ወንበር።",
    },
    {
        "sku": "HCH-004",
        "name": "Vintage Industrial Swivel Stool",
        "name_am": "የኢንዱስትሪ ዲዛይን የብረትና እንጨት ስቱል",
        "category_name": "Hybrid Chairs",
        "category_name_am": "የእንጨት እና ብረት ወንበሮች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HCH-004.jpg",
        "material": "Cast Iron Base & Solid Turned Hardwood",
        "dimensions": (42, 42, 75),
        "price": Decimal("7800.00"),
        "description": "Adjustable screw-mechanism steel base paired with a thick solid hardwood circular seat top.",
        "description_am": "ከፍታው የሚስተካከል የብረት እግር እና ጠንካራ ክብ የእንጨት መቀመጫ ያለው ባር ስቱል።",
    },
    {
        "sku": "HCH-005",
        "name": "Architectural Lounge Hybrid Chair",
        "name_am": "ዘመናዊ የሳሎን የብረትና እንጨት ወንበር",
        "category_name": "Hybrid Chairs",
        "category_name_am": "የእንጨት እና ብረት ወንበሮች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HCH-005.jpg",
        "material": "Sculpted Steel Angle & Solid Teak Slats",
        "dimensions": (70, 68, 78),
        "price": Decimal("12500.00"),
        "description": "Low slung angular steel chassis with warm cedar and mahogany slatted seating and relaxed incline.",
        "description_am": "ዝቅተኛ አቀማመጥ ያለው ውብ የብረት ቅርጽ እና የእንጨት ሰሌዳ መቀመጫ ያለው ዘመናዊ የእረፍት ወንበር።",
    },

    # ==========================================
    # 15. HYBRID TABLES (5) - Hybrid Works
    # ==========================================
    {
        "sku": "HTB-001",
        "name": "Live Edge Steel Frame Dining Table",
        "name_am": "የተፈጥሮ ቅርጽ እንጨት እና የብረት መመገቢያ ጠረጴዛ",
        "category_name": "Hybrid Tables",
        "category_name_am": "የእንጨት እና ብረት ጠረጴዛዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HTB-001.jpg",
        "material": "Solid Hardwood Slab & Trapezoidal Steel Legs",
        "dimensions": (200, 95, 76),
        "price": Decimal("32000.00"),
        "description": "Natural live-edge solid hardwood slab mounted on structural trapezoidal steel box section legs.",
        "description_am": "የተፈጥሮ ጫፍ ያለው ጠንካራ የእንጨት ሰሌዳ እና ጥቁር የብረት ቦክስ እግሮች ያሉት ውብ የመመገቢያ ጠረጴዛ።",
    },
    {
        "sku": "HTB-002",
        "name": "Industrial Coffee Table with Steel Base",
        "name_am": "የኢንዱስትሪ ዲዛይን የሳሎን የቡና ጠረጴዛ",
        "category_name": "Hybrid Tables",
        "category_name_am": "የእንጨት እና ብረት ጠረጴዛዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HTB-002.jpg",
        "material": "Thick Solid Pine Slab & X-Frame Steel Base",
        "dimensions": (120, 65, 45),
        "price": Decimal("16500.00"),
        "description": "Thick timber tabletop resting on architectural criss-cross welded steel base with matte black finish.",
        "description_am": "ወፍራም የእንጨት ገጽታ እና የኤክስ (X) ቅርጽ ያለው የብረት እግር ያለው የሳሎን የቡና ጠረጴዛ።",
    },
    {
        "sku": "HTB-003",
        "name": "Executive Metal Wood Conference Table",
        "name_am": "የስብሰባ አዳራሽ የብረትና እንጨት ጠረጴዛ",
        "category_name": "Hybrid Tables",
        "category_name_am": "የእንጨት እና ብረት ጠረጴዛዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HTB-003.jpg",
        "material": "Hardwood Veneer & Heavy Steel I-Beam Frame",
        "dimensions": (320, 120, 76),
        "price": Decimal("48000.00"),
        "description": "Large format boardroom table with central cable grommets, heavy steel I-beam legs, and solid teak veneer.",
        "description_am": "ለስብሰባ አዳራሽ የሚሆን ሰፊ ጠረጴዛ፣ ጠንካራ የብረት አይ-ቢም እግሮች እና የኬብል ማስተላለፊያ ያለው።",
    },
    {
        "sku": "HTB-004",
        "name": "Minimalist Hybrid Side Table",
        "name_am": "ዘመናዊ የጎን የቡና ጠረጴዛ",
        "category_name": "Hybrid Tables",
        "category_name_am": "የእንጨት እና ብረት ጠረጴዛዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HTB-004.jpg",
        "material": "Round Solid Oak Top & Slender Steel Tripod",
        "dimensions": (50, 50, 52),
        "price": Decimal("7500.00"),
        "description": "Compact round timber tabletop mounted upon a three-prong welded slender steel tripod base.",
        "description_am": "ክብ የኦክ እንጨት እና ቀጠን ያሉ ባለ ሶስት እግር የብረት መቆሚያ ያለው ቀላል የጎን ጠረጴዛ።",
    },
    {
        "sku": "HTB-005",
        "name": "Heavy Timber & Iron Console Table",
        "name_am": "ጠንካራ የእንጨትና የብረት ኮንሶል ጠረጴዛ",
        "category_name": "Hybrid Tables",
        "category_name_am": "የእንጨት እና ብረት ጠረጴዛዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HTB-005.jpg",
        "material": "Solid Hardwood Planks & Channel Steel Trestle",
        "dimensions": (150, 40, 82),
        "price": Decimal("19500.00"),
        "description": "Long entryway console table featuring distressed timber planking and structural iron trestle frame.",
        "description_am": "ለመግቢያ እና ለሳሎን ግድግዳ የሚሆን ረጅም የእንጨት ሰሌዳ እና የብረት ፍሬም ያለው ኮንሶል ጠረጴዛ።",
    },

    # ==========================================
    # 16. HYBRID BEDS (5) - Hybrid Works
    # ==========================================
    {
        "sku": "HBD-001",
        "name": "Industrial Steel Canopy Bed",
        "name_am": "የኢንዱስትሪ ዲዛይን የካኖፒ አልጋ",
        "category_name": "Hybrid Beds",
        "category_name_am": "የእንጨት እና ብረት አልጋዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HBD-001.jpg",
        "material": "Welded Steel Frame & Solid Hardwood Accents",
        "dimensions": (205, 185, 210),
        "price": Decimal("42000.00"),
        "description": "Full-height welded steel four-poster frame accented with a warm solid timber headboard and footboard.",
        "description_am": "ረጅም ባለ አራት ምሰሶ የብረት ፍሬም እና ጠንካራ የእንጨት የራስጌ ሰሌዳ ያለው ማራኪ የካኖፒ አልጋ።",
    },
    {
        "sku": "HBD-002",
        "name": "Timber & Metal Platform Bed",
        "name_am": "ዘመናዊ የብረት ፍሬም ፕላትፎርም አልጋ",
        "category_name": "Hybrid Beds",
        "category_name_am": "የእንጨት እና ብረት አልጋዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HBD-002.jpg",
        "material": "Box Section Steel & Walnut Headboard Planks",
        "dimensions": (200, 180, 95),
        "price": Decimal("36000.00"),
        "description": "Low-profile matte steel platform base supporting solid pine slatting and wide walnut paneled headboard.",
        "description_am": "ዝቅተኛ የብረት ቦክስ መዋቅር፣ ጠንካራ የእንጨት ሰሌዳዎች እና ሰፊ የዋልነት ራስጌ ያለው አልጋ።",
    },
    {
        "sku": "HBD-003",
        "name": "Floating Hybrid Master Bedstead",
        "name_am": "ተንሳፋፊ የብረትና እንጨት ማስተር አልጋ",
        "category_name": "Hybrid Beds",
        "category_name_am": "የእንጨት እና ብረት አልጋዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HBD-003.jpg",
        "material": "Cantilevered Steel Subframe & Live-Edge Timber",
        "dimensions": (210, 190, 105),
        "price": Decimal("49000.00"),
        "description": "Concealed cantilevered steel underframe giving a floating appearance, highlighted by a live-edge wooden headboard.",
        "description_am": "የተደበቀ የብረት ድጋፍ ተንሳፋፊ የሚያስመስለው እና የተፈጥሮ ቅርጽ ያለው የእንጨት ራስጌ ያለው ድንቅ አልጋ።",
    },
    {
        "sku": "HBD-004",
        "name": "Heavy-Duty Metal Frame Bunk Bed",
        "name_am": "ጠንካራ ባለሁለት ደርብ የብረትና እንጨት አልጋ",
        "category_name": "Hybrid Beds",
        "category_name_am": "የእንጨት እና ብረት አልጋዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HBD-004.jpg",
        "material": "Reinforced Steel Tubes & Solid Wood Steps",
        "dimensions": (200, 105, 175),
        "price": Decimal("34000.00"),
        "description": "Structural steel column bunk bed system with hardwood ladder rungs, protective side rails, and timber end panels.",
        "description_am": "ለልጆች ወይም ለእንግዳ ክፍል ተስማሚ የሆነ አስተማማኝ የብረት መዋቅር እና የእንጨት ደረጃ ያለው ባለ ሁለት ደርብ አልጋ።",
    },
    {
        "sku": "HBD-005",
        "name": "Minimalist Steel & Walnut Bedframe",
        "name_am": "ሚኒማሊስት የብረትና ዋልነት አልጋ",
        "category_name": "Hybrid Beds",
        "category_name_am": "የእንጨት እና ብረት አልጋዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HBD-005.jpg",
        "material": "Tubular Steel Perimeter & Solid Walnut Slats",
        "dimensions": (200, 160, 90),
        "price": Decimal("31000.00"),
        "description": "Slim profile tubular steel perimeter bedframe with slotted solid walnut headboard inserts and center leg support.",
        "description_am": "ቀጭንና ጠንካራ የብረት ፍሬም ከውብ የዋልነት እንጨት ማስገቢያዎች ጋር የተጣመረ ዘመናዊ አልጋ።",
    },

    # ==========================================
    # 17. HYBRID SHELVING (5) - Hybrid Works
    # ==========================================
    {
        "sku": "HSH-001",
        "name": "Industrial Ladder Bookcase",
        "name_am": "የኢንዱስትሪ ዲዛይን የብረትና እንጨት መጽሐፍ መደርደሪያ",
        "category_name": "Hybrid Shelving",
        "category_name_am": "የእንጨት እና ብረት መደርደሪያዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HSH-001.jpg",
        "material": "Angle Iron Uprights & Solid Pine Shelves",
        "dimensions": (90, 40, 190),
        "price": Decimal("15500.00"),
        "description": "Lean-to black iron vertical frame featuring five graduated deep solid pine storage and display tiers.",
        "description_am": "አምስት ደረጃዎች ያሉት ጥቁር የብረት አቋሚ እና ጠንካራ የእንጨት ሰሌዳዎች ያሉት የመጽሐፍ መደርደሪያ።",
    },
    {
        "sku": "HSH-002",
        "name": "Modular Steel & Oak Wall Unit",
        "name_am": "ሞዱላር የብረት እና ኦክ ግድግዳ መደርደሪያ",
        "category_name": "Hybrid Shelving",
        "category_name_am": "የእንጨት እና ብረት መደርደሪያዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HSH-002.jpg",
        "material": "Steel Grid Rails & Modular Oak Boxes",
        "dimensions": (180, 35, 200),
        "price": Decimal("26500.00"),
        "description": "Wall-anchored steel grid system holding modular solid oak shelves and locking bottom storage boxes.",
        "description_am": "በግድግዳ ላይ የሚገጠም የብረት ፍርግርግ እና እንደፍላጎት የሚቀያየሩ ጠንካራ የኦክ ሳጥኖች ያሉት መደርደሪያ።",
    },
    {
        "sku": "HSH-003",
        "name": "Geometric Metal Wood Display Shelf",
        "name_am": "ጂኦሜትሪክ ዲዛይን ያለው የማሳያ መደርደሪያ",
        "category_name": "Hybrid Shelving",
        "category_name_am": "የእንጨት እና ብረት መደርደሪያዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HSH-003.jpg",
        "material": "Powder-Coated Steel Geometry & Hardwood Inserts",
        "dimensions": (120, 32, 160),
        "price": Decimal("18500.00"),
        "description": "Asymmetric architectural metal frame incorporating interlocking staggered timber display platforms.",
        "description_am": "አስደናቂ የጂኦሜትሪክ የብረት ቅርጽ እና የተከፋፈሉ የእንጨት ማስቀመጫዎች ያሉት የማሳያ መደርደሪያ።",
    },
    {
        "sku": "HSH-004",
        "name": "Heavy Duty Industrial Storage Rack",
        "name_am": "ጠንካራ የኢንዱስትሪ እቃዎች መደርደሪያ",
        "category_name": "Hybrid Shelving",
        "category_name_am": "የእንጨት እና ብረት መደርደሪያዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HSH-004.jpg",
        "material": "Structural Angle Iron & 2-Inch Hardwood Timber",
        "dimensions": (160, 50, 180),
        "price": Decimal("24000.00"),
        "description": "Reinforced welded angle iron uprights supporting thick structural hardwood shelf boards for heavy loads.",
        "description_am": "ከባድ ክብደት የሚችሉ ወፍራም የእንጨት ጣውላዎች እና ጠንካራ አንግል ብረቶች ያሉት የእቃ መደርደሪያ።",
    },
    {
        "sku": "HSH-005",
        "name": "Minimalist Floating Pipe Shelf",
        "name_am": "ዘመናዊ የብረት ፓይፕ እና እንጨት ተንሳፋፊ መደርደሪያ",
        "category_name": "Hybrid Shelving",
        "category_name_am": "የእንጨት እና ብረት መደርደሪያዎች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HSH-005.jpg",
        "material": "Black Iron Flanged Pipes & Solid Timber Planks",
        "dimensions": (110, 25, 80),
        "price": Decimal("9500.00"),
        "description": "Wall-mounted black iron flange pipe brackets supporting smooth-sanded solid timber display planks.",
        "description_am": "በግድግዳ ላይ የሚገጠሙ ጥቁር የብረት ፓይፖች እና የተፈጥሮ እንጨት ሰሌዳዎች ያሉት ተንሳፋፊ መደርደሪያ።",
    },

    # ==========================================
    # 18. HYBRID WARDROBES & CABINETS (5) - Hybrid Works
    # ==========================================
    {
        "sku": "HWC-001",
        "name": "Industrial Mesh & Wood Armoire",
        "name_am": "የብረት ሜሽ እና ጠንካራ እንጨት ቁም ሳጥን",
        "category_name": "Hybrid Wardrobes & Cabinets",
        "category_name_am": "የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HWC-001.jpg",
        "material": "Welded Steel Frame, Wire Mesh & Solid Cedar",
        "dimensions": (110, 60, 200),
        "price": Decimal("38000.00"),
        "description": "Welded steel exoskeleton with expanded metal mesh doors enclosing solid cedar shelving and hanging rods.",
        "description_am": "የብረት መረብ በሮች፣ የብረት አጽም እና ጠንካራ የእንጨት መደርደሪያዎች ያሉት ዘመናዊ ቁም ሳጥን።",
    },
    {
        "sku": "HWC-002",
        "name": "Steel Frame Sideboard Credenza",
        "name_am": "የብረት ፍሬም ያለው የእንጨት ሳይድቦርድ",
        "category_name": "Hybrid Wardrobes & Cabinets",
        "category_name_am": "የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HWC-002.jpg",
        "material": "Heavy Box Steel Chassis & Solid Walnut Drawers",
        "dimensions": (160, 48, 85),
        "price": Decimal("31000.00"),
        "description": "Heavy steel box frame surrounding three soft-close wooden drawers and two slatted timber cabinet doors.",
        "description_am": "ጠንካራ የካሬ ብረት ፍሬም ውስጥ የተካተቱ የእንጨት መሳቢያዎች እና በሮች ያሉት ማራኪ ሳይድቦርድ ካቢኔት።",
    },
    {
        "sku": "HWC-003",
        "name": "Modern Open-Concept Hybrid Closet",
        "name_am": "ክፍት ዘመናዊ የብረትና እንጨት የልብስ መደርደሪያ",
        "category_name": "Hybrid Wardrobes & Cabinets",
        "category_name_am": "የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HWC-003.jpg",
        "material": "Floor-to-Ceiling Steel Columns & Oak Drawer Banks",
        "dimensions": (190, 55, 220),
        "price": Decimal("44000.00"),
        "description": "Floor-to-ceiling modular metal hanging frame with multiple solid timber shoe shelves and drawer banks.",
        "description_am": "ከወለል እስከ ኮርኒስ የሚደርስ የብረት ማንጠልጠያ እና የእንጨት የጫማ እና ልብስ መሳቢያዎች ያሉት ክፍት ቁም ሳጥን።",
    },
    {
        "sku": "HWC-004",
        "name": "Fluted Glass & Iron Display Cabinet",
        "name_am": "የብረት እና መስታወት ማሳያ ካቢኔት",
        "category_name": "Hybrid Wardrobes & Cabinets",
        "category_name_am": "የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HWC-004.jpg",
        "material": "Matte Black Steel, Fluted Glass & Hardwood Shelves",
        "dimensions": (100, 45, 185),
        "price": Decimal("36500.00"),
        "description": "Matte black steel framework with fluted glass door panels, internal solid timber shelves, and integrated LED accent channels.",
        "description_am": "ጥቁር የብረት ፍሬም፣ የተዋበ መስታወት እና ውስጣዊ የእንጨት መደርደሪያዎች ያሉት የማሳያ ካቢኔት።",
    },
    {
        "sku": "HWC-005",
        "name": "Heavy-Duty Metal & Timber Wardrobe",
        "name_am": "ጠንካራ የብረትና እንጨት ባለ ሁለት በር ቁም ሳጥን",
        "category_name": "Hybrid Wardrobes & Cabinets",
        "category_name_am": "የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች",
        "service_category": ServiceCategoryChoice.HYBRID_METAL_WOOD,
        "image_file": "HWC-005.jpg",
        "material": "Reinforced Steel Angles & Solid Mahogany Panels",
        "dimensions": (130, 62, 210),
        "price": Decimal("49000.00"),
        "description": "Full-size double door wardrobe built with steel reinforced corners, timber facade, and internal heavy-duty drawers.",
        "description_am": "በማዕዘን ብረት የተጠናከረ ጠንካራ የእንጨት ገጽታ እና የውስጥ መሳቢያዎች ያሉት አስተማማኝ ባለ ሁለት በር ቁም ሳጥን።",
    },'''

target_file = 'backend/apps/products/management/commands/seed_official_catalog.py'
with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Check if MHR-001 is already present
if 'MHR-001' in content:
    print('MHR-001 already in seed_official_catalog.py')
else:
    # 1. Categories insertion
    idx_cat_end = content.find(']\n\n# EXACT')
    if idx_cat_end != -1:
        part_before_cat = content[:idx_cat_end]
        part_after_cat = content[idx_cat_end:]
        part_before_cat = part_before_cat.replace(
            '# APPROVED 12 CATEGORIES CONFIGURATION (10 Wood Works, 2 Metal Works)',
            '# APPROVED 18 CATEGORIES CONFIGURATION (10 Wood Works, 3 Metal Works, 5 Hybrid Works)'
        )
        content = part_before_cat.rstrip() + ',\n' + new_categories_code + '\n' + part_after_cat
        print('Categories inserted.')
    else:
        print('Error: Could not find category end marker')

    # 2. Products section header and products insertion
    content = content.replace(
        '# EXACT 60 PRODUCTS (50 Wood Works across 10 categories + 10 Metal Works across 2 categories)',
        '# EXACT 90 PRODUCTS (50 Wood Works across 10 categories + 15 Metal Works across 3 categories + 25 Hybrid Works across 5 categories)'
    )

    idx_prod_end = content.find(']\n\nclass Command')
    if idx_prod_end != -1:
        part_before_prod = content[:idx_prod_end]
        part_after_prod = content[idx_prod_end:]
        content = part_before_prod.rstrip() + ',\n' + new_products_code + '\n' + part_after_prod
        print('Products inserted.')
    else:
        print('Error: Could not find product end marker')

    # 3. Command class text updates
    content = content.replace(
        'Seed the official 60-product catalog across 12 approved categories (50 Wood Works + 10 Metal Works).',
        'Seed the official 90-product catalog across 18 approved categories (50 Wood Works, 15 Metal Works, 25 Hybrid Works).'
    )
    content = content.replace(
        'Starting Official 60-Product Catalog Seeding...',
        'Starting Official 90-Product Catalog Seeding...'
    )

    # 4. Hybrid service resolution
    old_service_block = '''        wood_service = Service.objects.filter(slug__in=["wood-works", "woodworks"]).first()
        metal_service = Service.objects.filter(slug__in=["metal-works", "metalworks"]).first()'''

    new_service_block = '''        wood_service = Service.objects.filter(slug__in=["wood-works", "woodworks"]).first()
        metal_service = Service.objects.filter(slug__in=["metal-works", "metalworks"]).first()
        hybrid_service = Service.objects.filter(slug__in=["hybrid-metal-wood", "hybrid-metal-and-wood", "hybrid"]).first()'''

    content = content.replace(old_service_block, new_service_block)

    old_svc_assign = 'svc_record = wood_service if item["service_category"] == ServiceCategoryChoice.WOOD_WORKS else metal_service'
    new_svc_assign = '''if item["service_category"] == ServiceCategoryChoice.WOOD_WORKS:
                svc_record = wood_service
            elif item["service_category"] == ServiceCategoryChoice.HYBRID_METAL_WOOD:
                svc_record = hybrid_service
            else:
                svc_record = metal_service'''

    content = content.replace(old_svc_assign, new_svc_assign)

    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated seed_official_catalog.py successfully!')
