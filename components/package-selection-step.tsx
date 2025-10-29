import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import type { PackageData, PackageTypeDB } from './create-booking-dialog';
import { formatMoney } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PackageSelectionStepProps {
  packageData?: PackageData | null;
  onSubmit: (data: PackageData) => void;
}

export function calculateSubtotal(
  packageType: PackageTypeDB,
  guests?: number,
  classicPizzas?: number,
  signaturePizzas?: number
): number {
  if (packageType.name === 'full experience' && guests) {
    return guests * 1000;
  } else if (packageType.name === 'live setup') {
    let total = 0;
    if (classicPizzas) {
      const classicPrice = classicPizzas >= 100 ? 280 : 300;
      total += classicPizzas * classicPrice;
    }
    if (signaturePizzas) {
      const signaturePrice = signaturePizzas >= 100 ? 320 : 350;
      total += signaturePizzas * signaturePrice;
    }
    return total;
  }
  return 0;
}

export function PackageSelectionStep({ packageData, onSubmit }: PackageSelectionStepProps) {
  const [packages, setPackages] = useState<PackageTypeDB[]>([]);
  const [packageType, setPackageType] = useState<PackageTypeDB | null>(packageData?.packageType ? packageData.packageType : null);
  const [guests, setGuests] = useState(packageData?.guests ? packageData.guests : 10);
  const [classicPizzas, setClassicPizzas] = useState<number>(packageData?.classicPizzas ? packageData.classicPizzas : 0);
  const [signaturePizzas, setSignaturePizzas] = useState<number>(packageData?.signaturePizzas ? packageData.signaturePizzas : 20);
  const [error, setError] = useState('');
  const [state, setState] = useState<'loading' | 'idle'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (packageType?.name === 'full experience') {
      if (guests < 10 || guests > 200000) {
        setError('Number of guests must be between 10 and 20,000');
        return;
      }
      onSubmit({ packageType: packageType, guests, subtotal });
    } else if (packageType?.name === 'live setup') {
      const totalPizzas = (classicPizzas ?? 0) + (signaturePizzas ?? 0);
      if (totalPizzas < 20 || totalPizzas > 20000) {
        setError('Total number of pizzas must be between 20 and 20,000');
        return;
      }
      if (totalPizzas === 0) {
        setError('Please select at least one pizza');
        return;
      }
      onSubmit({ packageType: packageType, classicPizzas, signaturePizzas, subtotal });
    }
  };

  const subtotal = useMemo(() => {
    if (!packageType) return 0
    return calculateSubtotal(packageType, guests, classicPizzas, signaturePizzas);
  }, [packageType, guests, classicPizzas, signaturePizzas]);


  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setState('loading')
        const response = await fetch('/api/packages');
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const data = await response.json();
        console.log("🚀 ~ fetchPackages ~ data:", data)
        setPackages(data.packages);
      } catch (error) {
        console.error('Error fetching packages:', error);
        setError('Failed to fetch packages');
      } finally {
        setState('idle')
      }
    }

    fetchPackages();
  }, [])

  return (
    state === 'loading' ? <div className='grid place-content-center p-3'><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className='mb-3'>Package Type</Label>
        <RadioGroup value={JSON.stringify(packageType)} onValueChange={(value) => setPackageType(JSON.parse(value))}>
          {
            packages.map((packageType) => {
              return <div key={packageType.id} className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value={JSON.stringify(packageType)} id={packageType.name} />
                <Label htmlFor={packageType.name} className="flex-1 cursor-pointer capitalize">
                  {packageType.name}
                </Label>
              </div>;
            })
          }
        </RadioGroup>
      </div>

      {packageType?.name === 'full experience' && (
        <div>
          <Label htmlFor="guests">Number of Guests (10-20,000)</Label>
          <p className="my-1 text-gray-500 text-sm">Specify the number of guests for your event</p>
          <Input
            id="guests"
            type="number"
            min={10}
            max={20000}
            value={guests}
            onChange={(e) => setGuests(e.target.value === '' ? '' : parseInt(e.target.value) || 10)}
            className="mt-2 text-sm"
          />

          <div className="rounded-lg bg-gray-50 p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className='text-gray-700 text-base'>Subtotal:</span>
              <span className="text-base">{formatMoney(subtotal)}</span>
            </div>
          </div>
        </div>
      )}

      {packageType?.name === 'live setup' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="classic">Classic Pizzas</Label>
            <Input
              id="classic"
              type="number"
              min={0}
              max={20000}
              value={classicPizzas}
              onChange={(e) => setClassicPizzas(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              className="mt-2 text-sm"
            />
            <p className="mt-1.5 text-gray-500 text-sm">
              {(classicPizzas ?? 0) >= 100 ? 'EGP 280/pizza (≥100 pizzas)' : 'EGP 300/pizza (<100 pizzas)'}
            </p>
          </div>

          <div>
            <Label htmlFor="signature">Signature Pizzas</Label>
            <Input
              id="signature"
              type="number"
              min={0}
              max={20000}
              value={signaturePizzas}
              onChange={(e) => setSignaturePizzas(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              className="mt-2 text-sm"
            />
            <p className="mt-1.5 text-gray-500 text-sm">
              {(signaturePizzas ?? 0) >= 100 ? 'EGP 320/pizza (≥100 pizzas)' : 'EGP 350/pizza (<100 pizzas)'}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between">
              <span>Total Pizzas:</span>
              <span className='text-base'>{(classicPizzas ?? 0) + (signaturePizzas ?? 0)}</span>
            </div>
            <p className="mb-2 text-gray-500 text-sm">Minimum 20, Maximum 20,000 pizzas</p>
            <div className="rounded-lg bg-gray-100 p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-base">Subtotal:</span>
                <span className="text-base text-semibold">{formatMoney(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit">
          Continue to Details
        </Button>
      </div>
    </form>
  );
}
