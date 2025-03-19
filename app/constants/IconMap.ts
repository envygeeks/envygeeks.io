import { IconBook } from '#components';
import { IconHeart } from '#components';
import { IconClock } from '#components';
import { IconFolder } from '#components';
import { IconDesign } from '#components';
import { IconLaptop } from '#components';
import { IconMoney } from '#components';
import { IconHome } from '#components';

type IconT = Record<string, Component>
export const IconMap: IconT = {
  book: IconBook,
  clock: IconClock,
  design: IconDesign,
  folder: IconFolder,
  heart: IconHeart,
  home: IconHome,
  laptop: IconLaptop,
  money: IconMoney,
};