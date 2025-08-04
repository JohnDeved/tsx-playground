// Dynamic type loader for Monaco editor
// Fetches TypeScript definitions from esm.sh for imported packages

/**
 * Parse import statements from TypeScript/TSX code
 */
export function parseImports(code: string): string[] {
  const imports = new Set<string>()
  
  // Regex to match import statements
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g
  let match
  
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1]
    
    // Skip relative imports and built-in modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      // Extract package name (handle scoped packages and subpaths)
      let packageName: string
      
      if (importPath.startsWith('@')) {
        // Scoped package: @scope/package or @scope/package/subpath
        const parts = importPath.split('/')
        packageName = parts.slice(0, 2).join('/')
      } else {
        // Regular package: package or package/subpath
        packageName = importPath.split('/')[0]
      }
      
      // Map specific imports to their base packages
      if (importPath.startsWith('react-icons/')) {
        packageName = 'react-icons'
      }
      
      imports.add(packageName)
    }
  }
  
  return Array.from(imports)
}

/**
 * Fetch type definitions for a package from esm.sh
 */
export async function fetchTypeDefinitions(packageName: string): Promise<string | null> {
  try {
    console.log(`Attempting to fetch types for ${packageName} from esm.sh...`)
    
    // Try to fetch TypeScript definitions from esm.sh
    const response = await fetch(`https://esm.sh/${packageName}?target=es2022&format=esm`, {
      headers: {
        'Accept': 'application/typescript, text/plain'
      }
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch types for ${packageName}:`, response.status)
      return null
    }
    
    const content = await response.text()
    
    // Check if we got TypeScript definitions
    if (content.includes('declare') || content.includes('export') || content.includes('interface')) {
      console.log(`✅ Successfully loaded types for ${packageName}`)
      return content
    }
    
    return null
  } catch (error) {
    console.warn(`External requests blocked for ${packageName}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Load types for multiple packages and add them to Monaco
 */
export async function loadTypesForPackages(
  packages: string[], 
  monaco: any,
  loadedTypesRef: Set<string>
): Promise<void> {
  const newPackages = packages.filter(pkg => !loadedTypesRef.has(pkg))
  
  if (newPackages.length === 0) return
  
  console.log('Loading types for packages:', newPackages)
  
  for (const packageName of newPackages) {
    try {
      // Attempt dynamic loading from esm.sh
      const typeDefinitions = await fetchTypeDefinitions(packageName)
      
      if (typeDefinitions && monaco?.languages?.typescript?.typescriptDefaults?.addExtraLib) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          typeDefinitions,
          `file:///node_modules/@types/${packageName.replace('@', '').replace('/', '__')}/index.d.ts`
        )
        
        loadedTypesRef.add(packageName)
        console.log(`✅ Loaded types for ${packageName}`)
      } else {
        console.log(`❌ Failed to load types for ${packageName} - external requests may be blocked`)
        // Mark as loaded to avoid retrying
        loadedTypesRef.add(packageName)
      }
    } catch (error) {
      console.warn(`❌ Failed to load types for ${packageName}:`, error)
      // Mark as loaded to avoid retrying
      loadedTypesRef.add(packageName)
    }
  }
}