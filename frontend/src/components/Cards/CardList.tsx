// components/Cards/CardList.tsx
import { useState, useEffect } from 'react';
import { cardsApi } from '../../api/cards';
import { CardHoverPreview } from './CardHoverPreview';
import { useTranslation } from 'react-i18next';

interface Card {
  id: string;
  scryfall_id: string;
  owner_name: string;
  current_deck: string;
  is_borrowed: boolean;
  scryfall_data?: {
    name: string;
    colors: string[];
    prices: { usd?: string };
    legalities: Record<string, string>;
  };
}

export const CardList = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      const data = await cardsApi.getByCollection(collectionId);
      setCards(data);
    };
    loadCards();
  }, [collectionId]);

  return (
    <div className="card-list">
      <table>
        <thead>
          <tr>
            <th>{t('card.name')}</th>
            <th>{t('card.owner')}</th>
            <th>{t('card.deck')}</th>
            <th>{t('card.price')}</th>
            <th>{t('card.borrowed')}</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr
              key={card.id}
              onMouseEnter={() => setHoveredCard(card.scryfall_id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <td>{card.scryfall_data?.name}</td>
              <td>{card.owner_name}</td>
              <td>{card.current_deck || '-'}</td>
              <td>${card.scryfall_data?.prices.usd || 'N/A'}</td>
              <td>{card.is_borrowed ? t('yes') : t('no')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hoveredCard && <CardHoverPreview scryfallId={hoveredCard} />}
    </div>
  );
};