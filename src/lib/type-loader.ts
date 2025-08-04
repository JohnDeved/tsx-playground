// Dynamic type loader for Monaco editor
// Parses imports from code and fetches type definitions from esm.sh

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
      // Extract package name (handle scoped packages like @react-icons/io5)
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0]
      
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
    if (content.includes('declare') || content.includes('export')) {
      return content
    }
    
    // If no types found, try to fetch from @types package
    return await fetchTypesPackage(`@types/${packageName.replace('@', '').replace('/', '__')}`)
  } catch (error) {
    console.warn(`Error fetching types for ${packageName}:`, error)
    return null
  }
}

/**
 * Fetch from @types packages
 */
async function fetchTypesPackage(typesPackageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://esm.sh/${typesPackageName}?target=es2022&format=esm`)
    
    if (!response.ok) {
      return null
    }
    
    const content = await response.text()
    return content.includes('declare') ? content : null
  } catch {
    return null
  }
}



/**
 * Type loading cache to avoid refetching
 */
const typeCache = new Map<string, string>()

/**
 * Load types for multiple packages with caching
 */
export async function loadTypesForPackages(packages: string[]): Promise<Record<string, string>> {
  const types: Record<string, string> = {}
  
  for (const packageName of packages) {
    // Check cache first
    if (typeCache.has(packageName)) {
      types[packageName] = typeCache.get(packageName)!
      continue
    }
    
    try {
      // Try to fetch from esm.sh with a short timeout
      const fetchPromise = fetchTypeDefinitions(packageName)
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
      
      const typeDefinition = await Promise.race([fetchPromise, timeoutPromise])
      
      if (typeDefinition) {
        // Cache the result
        typeCache.set(packageName, typeDefinition)
        types[packageName] = typeDefinition
      }
    } catch {
      // Skip this package if type loading fails
      console.warn(`Failed to load types for ${packageName}, skipping`)
    }
  }
  
  return types
}